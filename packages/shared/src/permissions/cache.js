import { isEmpty } from 'lodash';
import config from 'config';

class PermissionCache {
  constructor() {
    this.ttl = config.auth.permissionCacheTTL;
  }

  cache = {};

  get(key) {
    return this.cache[key];
  }

  set(key, value) {
    this.cache[key] = value;
    if (!this.ttl) return;
    // Invalidate cached permissions after TTL
    setTimeout(() => {
      delete this.cache[key];
    }, this.ttl);
  }

  reset() {
    this.cache = {};
  }

  isEmpty() {
    return isEmpty(this.cache);
  }
}

export const permissionCache = new PermissionCache();
