import { isEmpty } from 'lodash';
import config from 'config';

class PermissionCache {
  cache = {};

  constructor() {
    if (config.permissions.cacheTTL) {
      this.resetInterval = setInterval(() => {
        this.reset();
      }, config.permissions.cacheTTL);
    }
  }

  get(key) {
    return this.cache[key];
  }

  set(key, value) {
    this.cache[key] = value;
  }

  reset() {
    this.cache = {};
  }

  isEmpty() {
    return isEmpty(this.cache);
  }
}

export const permissionCache = new PermissionCache();
