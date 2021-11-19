const Https = require("https");
const EventEmitter = require("events");
const Constants = require("./Constants");
const Guild = require("./discord/Guild");
const Channel = require("./discord/Channel");
const Route = require("./Route");
const Utils = require("./Utils");
const util = require("util");

class Bucket {
    constructor(request_manager, id) {
        this._request_manager = request_manager;
        this.id = id;
        this.busy = false;
        this.queue = [];
    }

    async process() {
        this.busy = true;
        let request;

        while (request = this.queue.shift()) {
            Utils.debug("Bucket", "Making request (" + request.route.method + "): queue size: " + this.queue.length + "");
            if (request.route.method === "GET") {
                const result = await this._request_manager.get(request.route.url, true)
                    .catch((err) => {request.reject(err)});

                request.resolve(result);
                if (result.headers["x-ratelimit-remaining"] === "0") {
                    const wait = Number.parseFloat(result.headers["x-ratelimit-reset-after"]) * 1000;
                    Utils.error("Bucket", `0 remaining requests in this bucket - we are being rate limited (${this.id}) Resuming in ${wait}`);

                    await Utils.wait(wait);
                }
            } else if (request.route.method === "POST") {
                const result = await this._request_manager.post(request.route.url, request.route.data)
                    .catch((err) => {request.reject(err)});

                request.resolve(result);
                if (result.headers["x-ratelimit-remaining"] === "0") {
                    const wait = Number.parseFloat(result.headers["x-ratelimit-reset-after"]) * 1000;
                    Utils.error("Bucket", `0 remaining requests in this bucket - we are being rate limited (${this.id}) Resuming in ${wait}`);

                    await Utils.wait(wait);
                }
            }
        }

        this.busy = false;
    }
}

class RequestManager {
    constructor(client) {
        this._client = client;
        this.user_agent = "DiscordBot (https://github.com/ToppleKek/dcore, " + require("../package.json").version + ")";
        this._busy = false;
        this._queue = [];
        this._buckets = {};
    }

    request(route) {
        return new Promise((resolve, reject) => {
            const request = {
                route,
                resolve,
                reject
            };

            let bucket = this._buckets[route.bucket];

            if (!bucket)
                bucket = (this._buckets[route.bucket] = new Bucket(this, route.bucket));

            bucket.queue.push(request);

            if (!bucket.busy)
                bucket.process();
        });
    }

    get(url, auth, opts = {}) {
        return new Promise((resolve, reject) => {
            const options = opts;

            if (!options.headers)
                options.headers = {};

            options.headers["User-Agent"] = this.user_agent;
            options.headers["X-RateLimit-Precision"] = "millisecond";

            if (auth)
                options.headers.Authorization = (this._client.bot ? "Bot " : "") + this._client.token;

            Https.get(url, options, (response) => {
                let data = "";

                response.on("data", (chunk) => {
                    data += chunk;
                });

                response.on("end", () => {
                    const result = {
                        status_code: response.statusCode,
                        headers: response.headers,
                        data
                    };

                    resolve(result);
                });
            }).on("error", (err) => {
                reject(err);
            });
        });
    }

    post(url, data, file, opts = {}) {
        return new Promise((resolve, reject) => {
            const options = opts;
            const payload = JSON.stringify(data);
            options.method = "POST";

            if (!options.headers)
                options.headers = {};

            options.headers["User-Agent"] = this.user_agent;
            options.headers["X-RateLimit-Precision"] = "millisecond";
            options.headers["Content-Type"] = "application/json";
            options.headers["Content-Length"] = payload.length;
            options.headers.Authorization = (this._client.bot ? "Bot " : "") + this._client.token;

            let response_data = "";
            Utils.debug("RequestManager::post", "POSTing to url: " + url);
            const request = Https.request(url, options, (response) => {
                response.on("data", (chunk) => {
                    response_data += chunk;
                });

                response.on("end", () => {
                    const result = {
                        status_code: response.statusCode,
                        headers: response.headers,
                        data: response_data
                    };

                    resolve(result);
                });
            }).on("error", (err) => {
                reject(err);
            });

            request.write(payload);
            request.end();
        });
    }

    async fetch_guild(id) {
        const route = new Route("GET", Constants.Endpoints.GUILDS + "/" + id, "", id);
        const cached_guild = this._client.guild_cache.get(id);
        const fetched_guild = new Guild(this._client, await this.request(route));
        const guild = Object.assign(cached_guild || {}, fetched_guild);

        this._client.guild_cache.set(id, guild);
        return guild;
    }

    async fetch_channel(id) {
        const route = new Route("GET", Constants.Endpoints.CHANNELS + "/" + id, id);
        const cached_channel = this._client.channel_cache.get(id);
        const fetched_channel = new Channel(this._client, await this.request(route));
        const channel = Object.assign(cached_channel || {}, fetched_channel);

        this._client.channel_cache.set(id, channel);
        return channel;
    }

    async fetch_message(channel_id, message_id) {
        const endpoint = Utils.endpoint(Constants.Endpoints.CHANNELS, channel_id, Constants.Endpoints.MESSAGES, message_id);
        const route = new Route("GET", endpoint, channel_id);
        const cached_message = this._client.message_cache.get(message_id);
        const fetched_message = new Channel(this._client, await this.request(route));
        const message = Object.assign(cached_message || {}, fetched_message);

        this._client.message_cache.set(id, message);
        return message;
    }

    async send_message(channel, message) {
        const endpoint = Constants.Endpoints.CHANNELS + "/" + channel.id + Constants.Endpoints.MESSAGES;
        const msg = (typeof message) === "object" ? message : {content: message};
        const route = new Route("POST", endpoint, channel.id, channel.guild_id, msg);
        return await this.request(route);
    }
}

module.exports = RequestManager;
