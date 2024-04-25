import config from 'config';
import TTLCache from '@isaacs/ttlcache';

const { ttl } = config.auth.permissionCache;

class PermissionCache {
  cache = new TTLCache({ ttl });

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
  }

  reset() {
    this.cache.clear();
  }

  isEmpty() {
    return this.cache.size === 0;
  }
}

export const permissionCache = new PermissionCache();
