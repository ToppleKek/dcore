const Constants = require("./Constants");

class Route {
    constructor(method, endpoint, channel_id = "", guild_id = "", data = {}) {
        this.method = method;
        this.url = Constants.Endpoints.BASE + endpoint;
        this.channel_id = channel_id;
        this.guild_id = guild_id;
        this.data = data;
    }

    get bucket() {
        return `${this.method}:${this.channel_id}:${this.guild_id}`;
    }
}

module.exports = Route;