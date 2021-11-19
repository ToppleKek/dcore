module.exports.API_URL = "https://discord.com";

module.exports.Endpoints = {
    BASE:        module.exports.API_URL + "/api/v6",
    BOT_GATEWAY: "/gateway/bot",
    GATEWAY:     "/gateway",
    GUILDS:      "/guilds",
    CHANNELS:    "/channels",
    MESSAGES:    "/messages"
};

module.exports.OPCodes = {
    DISPATCH:              0,
    HEARTBEAT:             1,
    IDENTIFY:              2,
    PRESENCE_UPDATE:       3,
    VOICE_STATE_UPDATE:    4,
    RESUME:                6,
    RECONNECT:             7,
    REQUEST_GUILD_MEMBERS: 8,
    INVALID_SESSION:       9,
    HELLO:                 10,
    HEARTBEAT_ACK:         11
};

module.exports.Intents = {
    GUILDS:                   1,
    GUILD_MEMBERS:            1 << 1, // Privileged
    GUILD_BANS:               1 << 2,
    GUILD_EMOJIS:             1 << 3,
    GUILD_INTEGRATIONS:       1 << 4,
    GUILD_WEBHOOKS:           1 << 5,
    GUILD_INVITES:            1 << 6,
    GUILD_VOICE_STATES:       1 << 7,
    GUILD_PRESENCES:          1 << 8, // Privileged
    GUILD_MESSAGES:           1 << 9,
    GUILD_MESSAGE_REACTIONS:  1 << 10,
    GUILD_MESSAGE_TYPING:     1 << 11,
    DIRECT_MESSAGES:          1 << 12,
    DIRECT_MESSAGE_REACTIONS: 1 << 13,
    DIRECT_MESSAGE_TYPING:    1 << 14
}

module.exports.DEFAULT_INTENTS = module.exports.Intents.GUILDS |
                                 module.exports.Intents.GUILD_BANS |
                                 module.exports.Intents.GUILD_EMOJIS |
                                 module.exports.Intents.GUILD_INTEGRATIONS |
                                 module.exports.Intents.GUILD_WEBHOOKS |
                                 module.exports.Intents.GUILD_INVITES |
                                 module.exports.Intents.GUILD_VOICE_STATES |
                                 module.exports.Intents.GUILD_MESSAGES |
                                 module.exports.Intents.GUILD_MESSAGE_REACTIONS |
                                 module.exports.Intents.GUILD_MESSAGE_TYPING |
                                 module.exports.Intents.DIRECT_MESSAGES |
                                 module.exports.Intents.DIRECT_MESSAGE_REACTIONS |
                                 module.exports.Intents.DIRECT_MESSAGE_TYPING;

module.exports.PRIVILEGED_INTENTS = module.exports.DEFAULT_INTENTS |
                                    module.exports.Intents.GUILD_MEMBERS |
                                    module.exports.Intents.GUILD_PRESENCES;