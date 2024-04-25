import { isEmpty } from 'lodash';
import config from 'config';

const ttl = BigInt(config.permissionCache.ttl * 1000000);

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
    this.expires = process.hrtime.bigint() + ttl;
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
    if (this.expires > process.hrtime.bigint()) return;
    this.reset();
  }
}

export const permissionCache = new PermissionCache();
