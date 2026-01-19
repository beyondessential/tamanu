import { get as lodashGet, pick } from 'lodash';
import { SettingPath } from '../types';
import { buildSettings } from '..';
import { settingsCache } from '../cache';
import { Models } from './readers/SettingsDBReader';

export const KEYS_EXPOSED_TO_FRONT_END = [
  'audit',
  'appointments',
  'ageDisplayFormat',
  'customisations',
  'features',
  'fields',
  'imagingCancellationReasons',
  'imagingPriorities',
  'insurer',
  'customisations',
  'locationAssignments',
  'printMeasures',
  'invoice',
  'labsCancellationReasons',
  'templates',
  'layouts',
  'security.mobile',
  'triageCategories',
  'upcomingVaccinations',
  'vaccinations',
  'vitalEditReasons',
  'medications',
  'sync',
  'mobileSync',
  'facilityTimeZone',
] as const;

export const KEYS_EXPOSED_TO_PATIENT_PORTAL = ['features', 'fileChooserMbSizeLimit'] as const;

export interface ReadSettingsOptions {
  facilityId?: string;
  countryTimeZone?: string;
}

export class ReadSettings<Path = SettingPath> {
  models: Models;
  facilityId?: string;
  countryTimeZone?: string;

  constructor(models: Models, options?: ReadSettingsOptions) {
    this.models = models;
    if (options) {
      this.facilityId = options.facilityId;
      this.countryTimeZone = options.countryTimeZone;
    }
  }

  async get<T extends string | number | object>(key: Path): Promise<T> {
    const settings = await this.getAll();
    return lodashGet(settings, key as string) as T;
  }

  async getFrontEndSettings() {
    const allSettings = await this.getAll();
    const frontEndSettings = pick(allSettings, KEYS_EXPOSED_TO_FRONT_END);
    return {
      ...frontEndSettings,
      countryTimeZone: this.countryTimeZone,
    };
  }

  async getPatientPortalSettings() {
    const allSettings = await this.getAll();
    const portalSettings = pick(allSettings, KEYS_EXPOSED_TO_PATIENT_PORTAL);
    return portalSettings;
  }

  async getAll() {
    let settings = settingsCache.getAllSettings(this.facilityId);
    if (!settings) {
      settings = await buildSettings(this.models, this.facilityId);
      settingsCache.setAllSettings(settings, this.facilityId);
    }
    return settings;
  }
}
