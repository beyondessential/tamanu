import { get as lodashGet, pick } from 'es-toolkit/compat';
import { ExposedFlag, SettingPath, SettingsSchema } from '../types';
import { buildSettings } from '..';
import { settingsCache } from '../cache';
import { Models } from './readers/SettingsDBReader';
import { globalSettings } from '../schema/global';
import { facilitySettings } from '../schema/facility';
import { centralSettings } from '../schema/central';

const allSchemas = [globalSettings, facilitySettings, centralSettings];
const getSchemasForSettingsContext = (facilityId?: string, globalOnly = false): SettingsSchema[] => {
  if (globalOnly) return [globalSettings];
  return facilityId ? [facilitySettings, globalSettings] : [centralSettings, globalSettings];
};

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
  globalOnly: boolean;
  constructor(
    models: Models,
    facilityId?: string,
    { globalOnly = false }: { globalOnly?: boolean } = {},
  ) {
    this.models = models;
    this.facilityId = facilityId;
    this.globalOnly = globalOnly;
  }

  // A facility server's server-wide reader (`settings.global`): global scope only.
  // A plain no-facility ReadSettings is the CENTRAL cascade and would serve central
  // defaults and central-mapped config values that don't apply on a facility server.
  static forGlobal(models: Models) {
    return new ReadSettings(models, undefined, { globalOnly: true });
  }

  async get<T extends string | number | object>(key: Path): Promise<T> {
    const settings = await this.getAll();
    return lodashGet(settings, key as string) as T;
  }

  // This is what is called on tamanu-web login. This gets only settings relevant to
  // the frontend so only what is needed is sent. No sensitive data is sent.
  // Settings are extracted from the schemas that apply to this reader's context.
  // spec: SETTINGS#exposure-to-clients
  async getFrontEndSettings() {
    const allSettings = await this.getAll();
    return pick(
      allSettings,
      getKeysByFlag('exposedToWeb', getSchemasForSettingsContext(this.facilityId, this.globalOnly)),
    );
  }

  async getPatientPortalSettings() {
    const allSettings = await this.getAll();
    return pick(
      allSettings,
      getKeysByFlag('exposedToPatientPortal', getSchemasForSettingsContext(this.facilityId, this.globalOnly)),
    );
  }

  // Cache bucket: per-facility, 'central' (no facility), or 'global' for global-only
  // readers — which must not share the central bucket.
  private cacheBucket() {
    return this.globalOnly ? 'global' : this.facilityId;
  }

  async getAll() {
    let settings = settingsCache.getAllSettings(this.cacheBucket());
    if (!settings) {
      settings = await buildSettings(this.models, this.facilityId, {
        globalOnly: this.globalOnly,
      });
      settingsCache.setAllSettings(settings, this.cacheBucket());
    }
    return settings;
  }
}
