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
  'patientDisplayIdPattern',
  'facilityTimeZone',
] as const;

export const KEYS_EXPOSED_TO_PATIENT_PORTAL = ['features', 'fileChooserMbSizeLimit'] as const;

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

  // This is what is called on tamanu-web login. This gets only settings relevant to
  // the frontend so only what is needed is sent. No sensitive data is sent.
  async getFrontEndSettings() {
    const allSettings = await this.getAll();
    return pick(allSettings, KEYS_EXPOSED_TO_FRONT_END);
  }

  async getPatientPortalSettings() {
    const allSettings = await this.getAll();
    return pick(allSettings, KEYS_EXPOSED_TO_PATIENT_PORTAL);
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
