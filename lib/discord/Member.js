const Route = require("../Route");
const Constants = require("../Constants");
const Utils = require("../Utils");

class Member {
    constructor(client, data, guild_id) {
        this._client       = client;
        this.user          = data.user || null;
        this.nick          = data.nick || "";
        //this.roles
        this.joined_at     = data.joined_at ? Date.parse(data.joined_at) : null;
        this.premium_since = data.premium_since ? Date.parse(data.premium_since) : null;
        this.deaf          = data.deaf || false;
        this.mute          = data.mute || false;
        this.guild_id      = guild_id;
    }

    async fetch() {
        if (!this.user)
            return null;

        const route = new Route("GET", `${Constants.Endpoints.GUILDS}/${this.guild_id}/members/${this.user.id}`, "", this.guild_id);
        const cached_member = this._client.member_cache.get(id);
        const fetched_member = new Member(this._client, await this.request(route));
        const channel = Object.assign(cached_member || {}, fetched_member);

        this._client.member_cache.set(id, channel);
        return channel;
    }
}