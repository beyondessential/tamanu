import { isEmpty } from 'lodash';
import config from 'config';

const ttl = config.permissionCache.ttl;

class PermissionCache {
  cache = {};

  expires = null;

  get(key) {
    this.invalidateIfExpired();
    return this.cache[key];
  }

  set(key, value) {
    this.cache[key] = value;
    if (this.expires) return;
    this.expires = Date.now() + ttl;
  }

  delete(key) {
    delete this.cache[key];
  }

  reset() {
    this.cache = {};
    this.expires = null;
  }

  isEmpty() {
    return isEmpty(this.cache);
  }

  invalidateIfExpired() {
    if (this.expires > Date.now()) return;
    this.reset();
  }
}

export const permissionCache = new PermissionCache();
