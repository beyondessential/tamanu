import { SETTINGS_SCOPES } from '@tamanu/constants';
import { cloneDeep, isArray, mergeWith } from 'es-toolkit/compat';

import { centralDefaults, facilityDefaults, globalDefaults } from '../schema';
import { Models, SettingsDBReader } from './readers/SettingsDBReader';
import { SettingsJSONReader } from './readers/SettingsJSONReader';
import { SettingsConfigReader } from './readers/SettingsConfigReader';

/**
 * Returns the cascade of applicable settings readers, in descending order of priority.
 * The config readers are a transitional fallback: they serve a deployment's local
 * config value for any key that has no setting yet, so config moving into settings
 * never changes behaviour. They sit below recorded settings and above schema defaults.
 */
// spec: SETTINGS#scopes-and-resolution
function getReaderCascade(models: Models, facilityId?: string, globalOnly = false) {
  if (globalOnly) {
    // A facility server's server-wide reader: global scope only, without the central
    // layers the no-facility (central) cascade below would wrongly serve there.
    return [
      new SettingsDBReader(models, SETTINGS_SCOPES.GLOBAL),
      new SettingsConfigReader(SETTINGS_SCOPES.GLOBAL),
      new SettingsJSONReader(globalDefaults),
    ];
  }
  return facilityId
    ? [
        new SettingsDBReader(models, SETTINGS_SCOPES.FACILITY, facilityId),
        new SettingsDBReader(models, SETTINGS_SCOPES.GLOBAL),
        new SettingsConfigReader(SETTINGS_SCOPES.FACILITY),
        new SettingsConfigReader(SETTINGS_SCOPES.GLOBAL),
        new SettingsJSONReader(facilityDefaults),
        new SettingsJSONReader(globalDefaults),
      ]
    : [
        new SettingsDBReader(models, SETTINGS_SCOPES.CENTRAL),
        new SettingsDBReader(models, SETTINGS_SCOPES.GLOBAL),
        new SettingsConfigReader(SETTINGS_SCOPES.CENTRAL),
        new SettingsConfigReader(SETTINGS_SCOPES.GLOBAL),
        new SettingsJSONReader(centralDefaults),
        new SettingsJSONReader(globalDefaults),
      ];
}

export async function buildSettings(
  models: Models,
  facilityId?: string,
  { globalOnly = false }: { globalOnly?: boolean } = {},
) {
  const readers = getReaderCascade(models, facilityId, globalOnly);
  let settings = {};
  for (const reader of readers) {
    const value = await reader.getSettings();
    if (value) {
      // Clone: mergeWith mutates its first arg, and some readers return shared
      // module-level objects (schema defaults, config) that must not be polluted.
      settings = mergeWith(
        cloneDeep(value),
        settings, // Prioritise previous value
        (_, settingValue) => (isArray(settingValue) ? settingValue : undefined), // Replace, don’t merge arrays
      );
    }
  }
  return settings;
}
