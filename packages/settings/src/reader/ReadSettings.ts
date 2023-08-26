import { get as lodashGet } from 'lodash';
import { buildSettings } from './buildSettings';
import { settingsCache } from '../cache';
export class ReadSettings {
  models: any;
  facilityId: string | undefined;
  constructor(models: any, facilityId: any) {
    this.models = models;
    this.facilityId = facilityId;
  }

  async get(key: any) {
    let settings = settingsCache.get();
    if (!settings) {
      settings = await buildSettings(this.models, this.facilityId);
      settingsCache.set(settings);
    }

    return lodashGet(settings, key);
  }
}
