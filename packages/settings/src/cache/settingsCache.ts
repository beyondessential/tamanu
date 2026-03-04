type Cache = Record<string, string | number | object>;

export class SettingsCache {
  // Map of facilityId (or 'central' for no facility) to cache objects
  allSettingsCache: Map<string, Cache | null> = new Map();

  // Map of facilityId to expiration timestamps
  expirationTimestamps: Map<string, number> = new Map();

  // TTL in milliseconds
  ttl = 60000;

  private getCacheKey(facilityId?: string): string {
    return facilityId ?? 'central';
  }

  getAllSettings(facilityId: string) {
    const key = this.getCacheKey(facilityId);

    // If cache is expired, reset it.
    if (!this.isValid(facilityId)) {
      this.reset(facilityId);
    }

    return this.allSettingsCache.get(key) || null;
  }

  setAllSettings(value: Cache, facilityId?: string) {
    const key = this.getCacheKey(facilityId);
    this.allSettingsCache.set(key, value);
    // Calculate expiration timestamp based on ttl
    this.expirationTimestamps.set(key, Date.now() + this.ttl);
  }

  reset(facilityId?: string) {
    if (facilityId === undefined) {
      this.allSettingsCache.clear();
      this.expirationTimestamps.clear();
    } else {
      // Clear specific facility cache
      const key = this.getCacheKey(facilityId);
      this.allSettingsCache.delete(key);
      this.expirationTimestamps.delete(key);
    }
  }

  isValid(facilityId?: string) {
    const key = this.getCacheKey(facilityId);
    const expirationTimestamp = this.expirationTimestamps.get(key);
    return expirationTimestamp && Date.now() < expirationTimestamp;
  }
}

export const settingsCache = new SettingsCache();
