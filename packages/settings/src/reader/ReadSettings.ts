/* eslint-disable no-unused-vars */
import { get as lodashGet, pick } from 'lodash';
import type { SettingPath } from '../types';
import { buildSettings } from '..';
import { settingsCache } from '../cache';
import type { Models } from './readers/SettingsDBReader';

export const KEYS_EXPOSED_TO_FRONT_END = [
  'appointments',
  'ageDisplayFormat',
  'customisations',
  'features',
  'fields',
  'imagingCancellationReasons',
  'imagingPriorities',
  'insurer',
  'customisations',
  'printMeasures',
  'invoice',
  'labsCancellationReasons',
  'templates',
  'layouts',
  'triageCategories',
  'upcomingVaccinations',
  'vaccinations',
  'vitalEditReasons',
] as const;

export class ReadSettings<Path = SettingPath> {
  models: Models;
  facilityId?: string;
  constructor(models: Models, facilityId?: string) {
    this.models = models;
    this.facilityId = facilityId;
  }

  async get(key: Path) {
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
