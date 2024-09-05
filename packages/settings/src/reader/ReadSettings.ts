/* eslint-disable no-unused-vars */
import { CentralSettingPath, FacilitySettingPath } from 'schema';
import { get as lodashGet, pick } from 'lodash';
import { buildSettings, SettingPath } from '..';
import { settingsCache } from '../cache';
import { Models } from './readers/SettingsDBReader';

export const KEYS_EXPOSED_TO_FRONT_END = [
  'customisations',
  'features',
  'imagingPriorities',
  'insurer',
  'invoice',
  'templates',
  'triageCategories',
  'upcomingVaccinations',
  'vaccinations',
  'fields',
] as const;

export class ReadSettings {
  models: Models;
  facilityId?: string;
  constructor(models: Models, facilityId?: string) {
    this.models = models;
    this.facilityId = facilityId;
  }

  async get(key: SettingPath) {
    const settings = await this.getAll();
    return lodashGet(settings, key as string);
  }

  // This is what is called on login. This gets only settings relevant to
  // the frontend so only what is needed is sent. No sensitive data is sent.
  async getFrontEndSettings() {
    let settings = settingsCache.getFrontEndSettings();
    if (!settings) {
      const allSettings = await this.getAll();
      settings = pick(allSettings, KEYS_EXPOSED_TO_FRONT_END);
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

export type FacilityReadSettings = ReadSettings & {
  get(key: FacilitySettingPath): Promise<unknown>;
};
export type CentralReadSettings = ReadSettings & {
  get(key: CentralSettingPath): Promise<unknown>;
};
