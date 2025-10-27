/* eslint-disable no-unused-vars */
import { get as lodashGet, pick } from 'lodash';
import { SettingPath, SettingsSchema } from '../types';
import { buildSettings } from '..';
import { settingsCache } from '../cache';
import { Models } from './readers/SettingsDBReader';
import { globalSettings } from '../schema/global';
import { facilitySettings } from '../schema/facility';

// Extract top-level keys from settings schema that have exposedToWeb: true
const extractExposedKeys = (schema: SettingsSchema): string[] => {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(schema.properties)) {
    if (value.exposedToWeb) keys.push(key);
  }
  return keys;
};

const getExposedKeys = (): string[] => {
  const globalKeys = extractExposedKeys(globalSettings);
  const facilityKeys = extractExposedKeys(facilitySettings);
  return [...globalKeys, ...facilityKeys];
};

export class ReadSettings<Path = SettingPath> {
  models: Models;
  facilityId?: string;
  constructor(models: Models, facilityId?: string) {
    this.models = models;
    this.facilityId = facilityId;
  }

  async get<T extends string | number | object>(key: Path): Promise<T> {
    const settings = await this.getAll();
    return lodashGet(settings, key as string) as T;
  }

  // This is what is called on login. This gets only settings relevant to
  // the frontend so only what is needed is sent. No sensitive data is sent.
  // Settings are automatically extracted based on exposedToWeb: true in the schema
  async getFrontEndSettings() {
    let settings = settingsCache.getFrontEndSettings();
    if (!settings) {
      const allSettings = await this.getAll();
      const exposedKeys = getExposedKeys();
      settings = pick(allSettings, exposedKeys);
      settingsCache.setFrontEndSettings(settings);
    }
    return settings;
  }

  async getAll() {
    let settings = settingsCache.getAllSettings();
    if (!settings) {
      settings = await buildSettings(this.models, this.facilityId);
      settingsCache.setAllSettings(settings);
    }
    return settings;
  }
}
