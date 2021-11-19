const Utils = require("./Utils");
const Constants = require("./Constants");
const User = require("./discord/User");
const Channel = require("./discord/Channel");
const Message = require("./discord/Message");
const Guild = require("./discord/Guild");
const util = require("util");

class WebSocketManager {
    constructor(client) {
        this._client = client;
        this.last_heartbeat_ack = true;
        this.connected = false;
        this.resuming = false;
        this.event_replay = false;
        this.session_id = null;
        this.last_seq = null;
    }

    message(data) {
        //Utils.debug("WebSocketManager", "WebSocket message: " + data);
        const msg = JSON.parse(data);

        switch (msg.op) {
            case Constants.OPCodes.DISPATCH:
                Utils.debug("WebSocketManager", "OPCODE: 0 - Event dispatch");

                this.last_seq = msg.s || this.last_seq;

                switch (msg.t) {
                    case "READY": {
                        Utils.debug("WebSocketManager", "READY Event");
                        this.session_id = msg.d.session_id;
                        this._client.client_user = new User(this._client, msg.d.user);

                        for (const guild of msg.d.guilds) {
                            const g = new Guild(this._client, guild);
                            this._client.guild_cache.set(g.id, g);
                        }

                        this._client.emit("ready");
                    } break;

                    case "RESUMED": {
                        this.event_replay = false;
                    } break;

                    case "CHANNEL_CREATE": {
                        const chan = new Channel(this._client, msg.d);
                        this._client.channel_cache.set(msg.d.id, chan);
                        this._client.emit("channel_create", chan);
                    } break;

                    case "CHANNEL_UPDATE": {
                        const old_chan = this._client.channel_cache.get(msg.d.id);
                        const new_chan = new Channel(this._client, msg.d);
                        this._client.channel_cache.set(msg.d.id, new_chan);
                        this._client.emit("channel_update", old_chan, new_chan);
                    } break;

                    case "CHANNEL_DELETE": {
                        const chan = this._client.channel_cache.get(msg.d.id);
                        this._client.channel_cache.delete(msg.d.id);
                        this._client.emit("channel_delete", chan);
                    } break;

                    case "CHANNEL_PINS_UPDATE": {
                        this._client.emit("channel_pins_update", msg.d);
                    } break;

                    case "GUILD_CREATE": {
                        Utils.debug("WebSocketManager", "GUILD_CREATE Event");

                        const cached_guild = this._client.guild_cache.get(msg.d.id);
                        const guild = new Guild(this._client, Object.assign(cached_guild || {}, new Guild(this._client, msg.d))); // Merge our cached version

                        this._client.guild_cache.set(msg.d.id, guild);
                        this._client.emit("guild_create", guild);

                        // This could have been a unavailable guild going online
                        // so check if this is a new guild
                        if (!cached_guild && !guild.unavailable)
                            this._client.emit("guild_add", guild);

                        for (const channel of msg.d.channels) {
                            channel.guild_id = msg.d.id;
                            this._client.channel_cache.set(channel.id, new Channel(this._client, channel));
                        }
                    } break;

                    case "GUILD_DELETE": {
                        Utils.debug("WebSocketManager", "GUILD_DELETE Event");

                        const guild = this._client.guild_cache.get(msg.d.id);
                        this._client.emit("guild_delete", guild);

                        if ((typeof msg.d.unavailable) === "undefined") { // Client removed from guild
                            this._client.emit("guild_remove", guild);
                            this._client.guild_cache.delete(msg.d.id);
                            Utils.info("WebSocketManager", "GUILD_DELETE: Removed from guild");
                        } else { // Guild is unavailable due to an outage
                            this._client.guild_cache.set(msg.d.id, Object.assign(this._client.guild_cache.get(msg.d.id), {unavailable: true}));
                            Utils.info("WebSocketManager", "GUILD_DELETE: Server unavailable");
                        }
                    } break;

                    case "MESSAGE_CREATE": {
                        const message = new Message(this._client, msg.d);
                        this._client.message_cache.set(msg.d.id, message);
                        this._client.emit("message_create", message);
                    } break;

                    case "MESSAGE_UPDATE": {
                        const old_message = this._client.message_cache.get(msg.d.id);
                        const new_message = new Message(this._client, msg.d);
                        this._client.message_cache.set(msg.d.id, new_message);
                        this._client.emit("message_update", old_message, new_message);
                    } break;

                    case "MESSAGE_DELETE": {
                        const message = this._client.message_cache.get(msg.d.id);
                        this._client.message_cache.delete(msg.d.id);
                        this._client.emit("message_delete", message);
                    } break;
                }
                break;

            case Constants.OPCodes.RECONNECT:
                this.try_reconnect_resume();
                break;

            case Constants.OPCodes.INVALID_SESSION:
                this.try_reconnect_resume(true);
                break;

            case Constants.OPCodes.HELLO:
                if (this.connected)
                    return;

                Utils.debug("WebSocketManager", "OPCODE: 10 - Hello! heartbeat_interval: " + msg.d.heartbeat_interval);
                this.connected = true;
                this.heartbeat_timer = setInterval(this.heartbeat.bind(this), msg.d.heartbeat_interval);

                if (this.resuming) {
                    Utils.debug("WebSocketManager", "Attempting gateway RESUME after dead connection");
                    this.send_payload(Constants.OPCodes.RESUME, {
                        d: {
                            token: this._client.token,
                            session_id: this.session_id,
                            seq: this.last_seq
                        }
                    });

                    this.event_replay = true;
                } else {
                    this.send_payload(Constants.OPCodes.IDENTIFY, {
                        d: {
                            token: this._client.token,
                            compress: false,
                            large_threshold: this._client.large_threshold,
                            intents: this._client.privileged_intents ? Constants.PRIVILEGED_INTENTS : this._client.intents,
                            properties: {
                                "$os": "linux",
                                "$browser": "dcore",
                                "$device": "dcore"
                            }
                        }
                    });
                }

                break;

            case Constants.OPCodes.HEARTBEAT_ACK:
                Utils.debug("WebSocketManager", "OPCODE: 11 - ACK");
                this.last_heartbeat_ack = true;
                break;
        }
    }

    disconnect() {
        this.connected = false;
        clearInterval(this.heartbeat_timer);
        this._client.ws.close();
        this._client.emit("disconnected");
    }

    async try_reconnect_resume(wait = false) {
        if (this.connected)
            this.disconnect();

        // In case of immediate disconnection (we are only allowed 1 IDENTIFY every 5 seconds)
        if (wait)
            await Utils.wait(5000);

        this.resuming = true;
        this._client.connect();
    }

    close(code, data) {
        Utils.error("WebSocketManager", "WebSocket closed with code: " + code + " err: " + data);
    }

    send_payload(op, data) {
        Utils.debug("WebSocketManager", "Sending opcode: " + op);
        data.op = op;
        this._client.ws.send(JSON.stringify(data));
    }

    heartbeat() {
        Utils.debug("WebSocketManager", "Sending heartbeat!");

        if (!this.last_heartbeat_ack) {
            Utils.error("WebSocketManager", "Did not receive ACK after last heartbeat");
            this.try_reconnect_resume();
            return;
        }

        this.last_heartbeat_ack = false;
        this.send_payload(Constants.OPCodes.HEARTBEAT, {d: this.session_id});
    }
}

module.exports = WebSocketManager;
