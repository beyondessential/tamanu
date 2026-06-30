import { SETTINGS_SCOPES } from '@tamanu/constants';
import { isArray, mergeWith } from 'es-toolkit/compat';

import {
  centralDefaults,
  centralSettings,
  facilityDefaults,
  facilitySettings,
  globalDefaults,
  globalSettings,
} from '../schema';
import { Models, SettingsDBReader } from './readers/SettingsDBReader';
import { SettingsJSONReader } from './readers/SettingsJSONReader';
import { SettingsConfigReader } from './readers/SettingsConfigReader';

/**
 * Returns the cascade of applicable settings readers, in descending order of priority.
 * The config readers are a transitional fallback: they serve a deployment's local
 * config value for any key that has no setting yet, so config moving into settings
 * never changes behaviour. They sit below recorded settings and above schema defaults.
 */
function getReaderCascade(models: Models, facilityId?: string) {
  return facilityId
    ? [
        new SettingsDBReader(models, SETTINGS_SCOPES.FACILITY, facilityId),
        new SettingsDBReader(models, SETTINGS_SCOPES.GLOBAL),
        new SettingsConfigReader(facilitySettings),
        new SettingsConfigReader(globalSettings),
        new SettingsJSONReader(facilityDefaults),
        new SettingsJSONReader(globalDefaults),
      ]
    : [
        new SettingsDBReader(models, SETTINGS_SCOPES.CENTRAL),
        new SettingsDBReader(models, SETTINGS_SCOPES.GLOBAL),
        new SettingsConfigReader(centralSettings),
        new SettingsConfigReader(globalSettings),
        new SettingsJSONReader(centralDefaults),
        new SettingsJSONReader(globalDefaults),
      ];
}

export async function buildSettings(models: Models, facilityId?: string) {
  const readers = getReaderCascade(models, facilityId);
  let settings = {};
  for (const reader of readers) {
    const value = await reader.getSettings();
    if (value) {
      settings = mergeWith(
        value,
        settings, // Prioritise previous value
        (_, settingValue) => (isArray(settingValue) ? settingValue : undefined), // Replace, don’t merge arrays
      );
    }
  }
  return settings;
}
