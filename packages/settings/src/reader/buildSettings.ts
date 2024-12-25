import { SETTINGS_SCOPES } from '@tamanu/constants';
import { isArray, mergeWith } from 'lodash';

import { centralDefaults, facilityDefaults, globalDefaults } from '../schema';
import { type Models, SettingsDBReader } from './readers/SettingsDBReader';
import { SettingsJSONReader } from './readers/SettingsJSONReader';

/** Returns the cascade of applicable settings readers, in descending order of priority */
function getReaderCascade(models: Models, facilityId?: string) {
  return facilityId
    ? [
        new SettingsDBReader(models, SETTINGS_SCOPES.FACILITY, facilityId),
        new SettingsDBReader(models, SETTINGS_SCOPES.GLOBAL),
        new SettingsJSONReader(facilityDefaults),
        new SettingsJSONReader(globalDefaults),
      ]
    : [
        new SettingsDBReader(models, SETTINGS_SCOPES.CENTRAL),
        new SettingsDBReader(models, SETTINGS_SCOPES.GLOBAL),
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
