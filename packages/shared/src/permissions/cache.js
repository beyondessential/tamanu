import { isEmpty } from 'lodash';

class PermissionCache {
  cache = {};

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
