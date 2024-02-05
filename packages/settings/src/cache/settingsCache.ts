type Cache = Record<string, string | number | object>;
export class SettingsCache {
  allSettingsCache: Cache | null = null;
  frontEndSettingsCache: Cache | null = null;

  expirationTimestamp: number | null = null;

  // TTL in milliseconds
  ttl = 60000;

  getAllSettings() {
    // If cache is expired, reset it.
    if (!this.isValid()) {
      this.reset();
    }

    return this.allSettingsCache;
  }

  getFrontEndSettings() {
    if (!this.isValid()) {
      this.reset();
    }

    return this.frontEndSettingsCache;
  }

  setAllSettings(value: Cache) {
    this.allSettingsCache = value;
    // Calculate expiration timestamp based on ttl
    this.expirationTimestamp = Date.now() + this.ttl;
  }

  setFrontEndSettings(value: Cache) {
    this.frontEndSettingsCache = value;
    this.expirationTimestamp = Date.now() + this.ttl;
  }


  reset() {
    this.allSettingsCache = null;
    this.frontEndSettingsCache = null;
    this.expirationTimestamp = null;
  }

  isValid() {
    return this.expirationTimestamp && Date.now() < this.expirationTimestamp;
  }
}

export const settingsCache = new SettingsCache();
