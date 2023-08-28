"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "settingsCache", {
    enumerable: true,
    get: ()=>settingsCache
});
let SettingsCache = class SettingsCache {
    get() {
        // If cache is expired, reset it.
        if (!this.isValid()) {
            this.reset();
        }
        return this.cache;
    }
    set(value) {
        this.cache = value;
        // Calculate expiration timestamp based on ttl
        this.expirationTimestamp = Date.now() + this.ttl;
    }
    reset() {
        this.cache = null;
        this.expirationTimestamp = null;
    }
    isValid() {
        return this.expirationTimestamp && Date.now() < this.expirationTimestamp;
    }
    constructor(){
        this.cache = null;
        this.expirationTimestamp = null;
        // TTL in milliseconds
        this.ttl = 60000;
    }
};
const settingsCache = new SettingsCache();

//# sourceMappingURL=settingsCache.js.map