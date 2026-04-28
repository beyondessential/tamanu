type Cache = Record<string, string | number | object>;

export class SettingsCache {
  // Map of facilityId (or 'central' for no facility) to cache objects.
  // Invalidated by the settings-table NOTIFY listener; no TTL.
  allSettingsCache: Map<string, Cache | null> = new Map();

  private getCacheKey(facilityId?: string): string {
    return facilityId ?? 'central';
  }

  getAllSettings(facilityId?: string) {
    return this.allSettingsCache.get(this.getCacheKey(facilityId)) ?? null;
  }

  setAllSettings(value: Cache, facilityId?: string) {
    this.allSettingsCache.set(this.getCacheKey(facilityId), value);
  }

  reset(facilityId?: string) {
    if (facilityId === undefined) {
      this.allSettingsCache.clear();
    } else {
      this.allSettingsCache.delete(this.getCacheKey(facilityId));
    }
  }

  // No-arg form returns whether ANY bucket is cached (used by tests).
  has(facilityId?: string) {
    if (facilityId === undefined) {
      return this.allSettingsCache.size > 0;
    }
    return this.allSettingsCache.has(this.getCacheKey(facilityId));
  }
}

export const settingsCache = new SettingsCache();
