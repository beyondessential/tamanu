import { get as lodashGet, pick } from 'lodash';
import { ExposedFlag, SettingPath, SettingsSchema } from '../types';
import { buildSettings } from '..';
import { settingsCache } from '../cache';
import { Models } from './readers/SettingsDBReader';
import { globalSettings } from '../schema/global';
import { facilitySettings } from '../schema/facility';
import { centralSettings } from '../schema/central';

const allSchemas = [globalSettings, facilitySettings, centralSettings];

// Recursively walks the schema tree collecting keys that have the given flag set.
// When a node has the flag, its full dot-notated path is included and children are
// skipped (the whole subtree is exposed). When a node is a nested schema without the
// flag, we recurse into it to check its children (e.g. security.mobile).
const extractExposedKeys = (schema: SettingsSchema, flag: ExposedFlag, prefix = ''): string[] => {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(schema.properties)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value[flag]) {
      keys.push(fullKey);
    } else if ('properties' in value) {
      keys.push(...extractExposedKeys(value as SettingsSchema, flag, fullKey));
    }
  }
  return keys;
};

export const getKeysByFlag = (flag: ExposedFlag): string[] =>
  allSchemas.flatMap(schema => extractExposedKeys(schema, flag));

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
  // Settings are automatically extracted based on exposedToWeb: true in the schema
  async getFrontEndSettings() {
    const allSettings = await this.getAll();
    return pick(allSettings, getKeysByFlag('exposedToWeb'));
  }

  async getPatientPortalSettings() {
    const allSettings = await this.getAll();
    return pick(allSettings, getKeysByFlag('exposedToPatientPortal'));
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
