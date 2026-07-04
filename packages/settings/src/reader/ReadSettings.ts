import { get as lodashGet, pick } from 'es-toolkit/compat';
import { ExposedFlag, SettingPath, SettingsSchema } from '../types';
import { buildSettings } from '..';
import { settingsCache } from '../cache';
import { Models } from './readers/SettingsDBReader';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { globalSettings } from '../schema/global';
import { facilitySettings } from '../schema/facility';
import { centralSettings } from '../schema/central';

const allSchemas = [globalSettings, facilitySettings, centralSettings];

// Cache key for the machine-scope reader; can't collide with a facility id.
const SERVER_CACHE_KEY = 'scope:server';
const getSchemasForSettingsContext = (facilityId?: string): SettingsSchema[] =>
  facilityId ? [facilitySettings, globalSettings] : [centralSettings, globalSettings];

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

export const getKeysByFlag = (
  flag: ExposedFlag,
  schemas: SettingsSchema[] = allSchemas,
): string[] => schemas.flatMap(schema => extractExposedKeys(schema, flag));

export class ReadSettings<Path = SettingPath> {
  models: Models;
  facilityId?: string;
  scope?: string;
  constructor(models: Models, facilityId?: string, scope?: string) {
    this.models = models;
    this.facilityId = facilityId;
    this.scope = scope;
  }

  private get cacheKey() {
    return this.scope === SETTINGS_SCOPES.SERVER ? SERVER_CACHE_KEY : this.facilityId;
  }

  async get<T extends string | number | object>(key: Path): Promise<T> {
    const settings = await this.getAll();
    return lodashGet(settings, key as string) as T;
  }

  // This is what is called on tamanu-web login. This gets only settings relevant to
  // the frontend so only what is needed is sent. No sensitive data is sent.
  // Settings are extracted from the schemas that apply to this reader's context.
  async getFrontEndSettings() {
    const allSettings = await this.getAll();
    return pick(
      allSettings,
      getKeysByFlag('exposedToWeb', getSchemasForSettingsContext(this.facilityId)),
    );
  }

  async getPatientPortalSettings() {
    const allSettings = await this.getAll();
    return pick(
      allSettings,
      getKeysByFlag('exposedToPatientPortal', getSchemasForSettingsContext(this.facilityId)),
    );
  }

  async getAll() {
    let settings = settingsCache.getAllSettings(this.cacheKey);
    if (!settings) {
      settings = await buildSettings(this.models, this.facilityId, this.scope);
      settingsCache.setAllSettings(settings, this.cacheKey);
    }
    return settings;
  }
}
