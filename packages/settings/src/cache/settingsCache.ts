class SettingsCache {
  cache: any | null = null;

  expirationTimestamp: number | null = null;

  // TTL in milliseconds
  ttl = 60000;

  get() {
    // If cache is expired, reset it.
    if (!this.isValid()) {
      this.reset();
    }

    return this.cache;
  }

  set(value: any) {
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
}

export const settingsCache = new SettingsCache();
