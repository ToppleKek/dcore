const EventEmitter = require("events");
const WebSocket = require("ws");
const Constants = require("./Constants");
const RequestManager = require("./RequestManager");
const WebSocketManager = require("./WebSocketManager");
const Utils = require("./Utils");
const util = require("util");

const DEFAULT_OPTIONS = {
    debug: false, // Show debug messages
    bot: true, // Use a bot account
    intents: Constants.DEFAULT_INTENTS, // What intents to request
    privileged_intents: false, // Add privileged intents to the defaults (alternatively, supply needed intents in the intents field)
    large_threshold: 250, // Value between 50 and 250, total number of members where the gateway will stop sending offline members in the guild member list
    token: "" // Authentication token
};

class Client extends EventEmitter {
    constructor(options) {
        super();

        this.options = Object.assign(DEFAULT_OPTIONS, options);
        this.request_manager = new RequestManager(this);
        this.websocket_manager = new WebSocketManager(this);
        this.client_user = null;
        this.message_cache = new Map();
        this.guild_cache = new Map();
        this.channel_cache = new Map();
        this.member_cache = new Map();
        
        Utils.use_debug = this.options.debug;
        Utils.debug("Client.js", "dir RequestManager: " + util.inspect(RequestManager));
    }

    async connect() {
        if (this.options.token === "")
            throw new Error("No token provided");

        let gateway_response;

        if (this.options.bot) {
            gateway_response = await this.request_manager.get(Constants.Endpoints.BASE + Constants.Endpoints.BOT_GATEWAY, true)
                .catch((err) => {
                    throw new Error(err);
                });
        } else {
            gateway_response = await this.request_manager.get(Constants.Endpoints.BASE + Constants.Endpoints.GATEWAY, false)
                .catch((err) => {
                    throw new Error(err);
                });
        }

        Utils.debug("connect", "Got gateway response: " + util.inspect(gateway_response));

        const gw = JSON.parse(gateway_response.data);
        this.ws = new WebSocket(gw.url + "?v=6&encoding=json");

        this.ws.on("message", this.websocket_manager.message.bind(this.websocket_manager));
        this.ws.once("close", this.websocket_manager.close.bind(this.websocket_manager));
    }

    get token() {
        return this.options.token;
    }

    get bot() {
        return this.options.bot;
    }

    get user() {
        return this.client_user;
    }
}

module.exports = Client;