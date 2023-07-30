import { isEmpty } from 'lodash';
import config from 'config';

class PermissionCache {
  constructor() {
    this.cacheTTL = config.permissions?.cacheTTL;
  }

  cache = {};

  get(key) {
    return this.cache[key];
  }

  set(key, value) {
    this.cache[key] = value;
    if (!this.cacheTTL) return;
    // Invalidate cached permissions after TTL
    setTimeout(() => {
      delete this.cache[key];
    }, config.permissions?.cacheTTL);
  }

  reset() {
    this.cache = {};
  }

  isEmpty() {
    return isEmpty(this.cache);
  }
}

export const permissionCache = new PermissionCache();
