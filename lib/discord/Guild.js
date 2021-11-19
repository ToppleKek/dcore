const util = require("util");


class Guild {
    constructor(client, data) {
        this.id = data.id || "";
        this.name = data.name || "";
        this.icon = data.icon || "";
        this.splash = data.splash || "";
        this.discovery_splash = data.discovery_splash || "";
        this.owner_id = data.owner_id || "";
        this.region = data.region || "";
        this.afk_channel_id = data.afk_channel_id || "";
        this.afk_timeout = data.afk_timeout || 0;
        this.verification_level = data.verification_level || 0;
        this.default_message_notifications = data.default_message_notifications || 0;
        this.explicit_content_filter = data.explicit_content_filter || 0;
        // this.roles = *ARRAY OF ROLES* TODO
        // this.emojis = *ARRAY OF EMOJIS* TODO
        this.features = data.features || [];
        this.mfa_level = data.mfa_level || 0;
        this.application_id = data.application_id || "";
        this.widget_enabled = ((typeof data.widget_enabled) === "boolean") ? data.widget_enabled : false;
        this.widget_channel_id = data.widget_channel_id || "";
        this.system_channel_id = data.system_channel_id || "";
        this.system_channel_flags = data.system_channel_flags || 0;
        this.rules_channel_id = data.rules_channel_id || "";
        this.joined_at = data.joined_at || 0;
        this.large = ((typeof data.large) === "boolean") ? data.large : false;
        this.unavailable = ((typeof data.unavailable) === "boolean") ? data.unavailable : false;
        this.member_count = data.member_count || 0;
        // this.voice_states = *ARRAY OF PARTIAL VOICE STATE OBJECTS* TODO
        // this.members = *ARRAY OF MEMBERS* TODO
        // if (data.channels) {
        //     for (let channel of data.channels) // TODO

        // }

        // this.presences = *ARRAY OF PARTIAL PRESENCE UPDATE OBJECTS* TODO
        this.max_presences = data.max_presences || 0;
        this.max_members = data.max_members || 0;
        this.vanity_url_code = data.vanity_url_code || "";
        this.description = data.description || "";
        this.banner = data.banner || "";
        this.premium_tier = data.premium_tier || 0;
        this.premium_subscription_count = data.premium_subscription_count || 0;
        this.preferred_locale = data.preferred_locale || "";
        this.public_updates_channel_id = data.public_updates_channel_id | "";
        this.max_video_channel_users = data.max_video_channel_users || 0;
        this.approximate_member_count = data.approximate_member_count || 0;
        this.approximate_presence_count = data.approximate_presence_count || 0;
    }

    async fetch() {
        return await this._client.request_manager.fetch_guild(this.id);
    }
}

module.exports = Guild;