const User = require("./User");
const Route = require("../Route");
const Constants = require("../Constants");
const Utils = require("../Utils");
const util = require("util");

class Channel {
    constructor(client, data) {
        this._client = client;
        this.id            = data.id || 0;
        this.type      = data.type || 0;
        this.guild_id = data.guild_id || "";
        this.position = data.position || 0;
        this.name = data.name || "";
        this.topic = data.topic || "";
        this.nsfw = ((typeof data.nsfw) == "boolean") ? data.nsfw : false;
        this.last_message_id = data.last_message_id || "";
        this.bitrate = data.bitrate || 0;
        this.user_limit = data.user_limit || 0;
        this.rate_limit_per_user = data.rate_limit_per_user || 0;
        this.recipients = [];

        if (data.recipients) {
            for (const user of data.recipients)
                this.recipients.push(new User(this._client, user));
        }

        this.icon = data.icon || "";
        this.owner_id = data.owner_id || "";
        this.application_id = data.application_id || "";
        this.parent_id = data.parent_id || "";
        this.last_pin_timestamp = data.last_pin_timestamp || "";
    }

    get guild() {
        return this._client.guild_cache.get(this.guild_id);
    }

    async fetch() {
        const route = new Route("GET", Utils.endpoint(Constants.Endpoints.CHANNELS, id), id);
        const cached_channel = this._client.channel_cache.get(id);
        const fetched_channel = new Channel(this._client, await this._client.request_manager.request(route));
        const channel = Object.assign(cached_channel || {}, fetched_channel);

        this._client.channel_cache.set(id, channel);
        return channel;
    }

    async send(message) {
        Utils.debug("Channel.js", "dir Route: " + util.inspect(Route));
        const endpoint = Utils.endpoint(Constants.Endpoints.CHANNELS, this.id, Constants.Endpoints.MESSAGES);
        const msg = (typeof message) === "object" ? message : {content: message};
        const route = new Route("POST", endpoint, this.id, this.guild_id, msg);
        return await this._client.request_manager.request(route);
    }
}

module.exports = Channel;