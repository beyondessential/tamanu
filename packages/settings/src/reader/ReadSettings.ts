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
    const settings = await this.getAll();
    return lodashGet(settings, key);
  }

  // This is what is called on login. This gets only settings relevant to 
  // the frontend so only what is needed is sent. No sensitive data is sent.
  async getFrontEndSettings() {
    const settings = await this.getAll();
    const frontEndSettingKeys = [
      'features',
      'localisation',
      'previewUvciFormat',
      'imagingTypes',
      'country',
      'printMeasures',
    ];

    const frontEndSettings = Object.fromEntries(
      Object.entries(settings).filter(([key]) => frontEndSettingKeys.includes(key)),
    );

    return frontEndSettings;
  }

  async getAll() {
    let settings = settingsCache.get();
    if (!settings) {
      settings = await buildSettings(this.models, this.facilityId);
      settingsCache.set(settings);
    }
    return settings;
  }
}
