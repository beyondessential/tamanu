import { get as lodashGet } from 'lodash';
import { buildSettings } from '../index';
import { settingsCache } from '../cache';
import { Models } from './readers/SettingsDBReader';
export class ReadSettings {
  models: Models;
  facilityId?: string;
  constructor(models: Models, facilityId?: string) {
    this.models = models;
    this.facilityId = facilityId;
  }

  async get(key: string) {
    let settings = settingsCache.get();
    if (!settings) {
      settings = await buildSettings(this.models, this.facilityId);
      settingsCache.set(settings);
    }

    if (!key) {
      return settings;
    }
    return lodashGet(settings, key);
  }
}
