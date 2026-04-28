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

  // When called with an explicit facilityId, returns whether that bucket is cached.
  // When called with no argument, returns whether ANY bucket is cached — mirroring
  // `reset()`'s no-arg semantics. Tests rely on the no-arg form to assert that an
  // async invalidation has cleared everything; using only the 'central' key here
  // would silently miss stale facility-scoped entries.
  has(facilityId?: string) {
    if (facilityId === undefined) {
      return this.allSettingsCache.size > 0;
    }
    return this.allSettingsCache.has(this.getCacheKey(facilityId));
  }
}

export const settingsCache = new SettingsCache();
