class User {
    constructor(client, data) {
        this._client       = client;
        this.id            = data.id || 0;
        this.username      = data.username || "";
        this.discriminator = data.discriminator || "";
        this.avatar        = data.avatar || "";
        this.bot           = ((typeof data.bot) == "boolean") ? data.bot : false;
        this.system        = ((typeof data.system) == "boolean") ? data.system : false;
        this.mfa_enabled   = ((typeof data.mfa_enabled) == "boolean") ? data.mfa_enabled : false;
        this.locale        = data.locale || "";
        this.verified      = ((typeof data.verified) == "boolean") ? data.verified : false;
        this.email         = data.email || "";
        this.flags         = data.flags || 0;
        this.premium_type  = data.premium_type || 0;
        this.public_flags  = data.public_flags || 0;

        this.member        = data.member || null; // Partial member object sent with some events
    }
}

module.exports = User;