const User = require("./User");
const Route = require("../Route");
const Channel = require("./Channel");

class Message {
    constructor(client, data) {
        this._client           = client;
        this.id                = data.id || "";
        this.channel_id        = data.channel_id || "";
        this.guild_id          = data.guild_id || "";
        this.author            = data.author ? new User(this._client, data.author) : null;
        this.content           = data.content || "";
        this.timestamp         = data.timestamp || "";
        this.edited_timestamp  = data.edited_timestamp || "";
        this.tts               = ((typeof data.tts) == "boolean") ? data.tts : false;
        this.mention_everyone  = ((typeof data.mention_everyone) == "boolean") ? data.mention_everyone : false;
        this.mentions          = [];

        if (data.mentions) {
            for (const mention of data.mentions)
                this.mentions.push(new User(this._client, mention));
        }

        this.mention_roles     = data.mention_roles || [];
        //this.mention_channels = data.mention_channels || []; See docs on why this sucks
        // this.attachments
        // this.embeds
        // this.reactions
        this.nonce             = data.nonce || null;
        this.pinned            = ((typeof data.pinned) === "boolean") ? data.pinned : false;
        this.webhook_id        = data.webhook_id || "";
        this.type              = data.type || 0;
        // this.activity
        // this.application
        // this.message_reference
        this.flags             = data.flags || 0;
    }

    get channel() {
        let channel = this._client.channel_cache.get(this.channel_id);

        if (!channel) {
            channel = new Channel(this._client, {id: this.channel_id})
            this._client.channel_cache.set(this.channel_id, channel);
        }

        return channel;
    }

    get guild() {
        let guild = this._client.channel_cache.get(this.guild_id);

        if (!guild) {
            guild = new Guild(this._client, {id: this.guild_id});
            this._client.guild_cache.set(this.guild_id, guild);
        }

        return guild;
    }

    get member() {
        if (!author)
            return null;

        return this._client.member_cache.get(this.author.id);
    }

    async fetch() {
        const endpoint = Utils.endpoint(Constants.Endpoints.CHANNELS, channel_id, Constants.Endpoints.MESSAGES, message_id);
        const route = new Route("GET", endpoint, channel_id);
        const cached_message = this._client.message_cache.get(message_id);
        const fetched_message = new Message(this._client, await this._client.request_manager.request(route));
        const message = Object.assign(cached_message || {}, fetched_message);

        this._client.message_cache.set(id, message);
        return message;
        //return await this._client.request_manager.fetch_channel(this.channel_id, this.id);
    }
}

module.exports = Message;