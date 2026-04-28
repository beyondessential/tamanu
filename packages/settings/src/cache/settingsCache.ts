type Cache = Record<string, string | number | object>;

export class SettingsCache {
  // Map of facilityId (or 'central' for no facility) to cache objects.
  // Invalidation is driven by the `notify_settings_changed` Postgres trigger
  // via `registerSettingsCacheInvalidator`, so no TTL is needed.
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

  has(facilityId?: string) {
    return this.allSettingsCache.has(this.getCacheKey(facilityId));
  }
}

export const settingsCache = new SettingsCache();
