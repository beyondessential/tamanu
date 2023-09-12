import { merge } from 'lodash';
import { SETTINGS_SCOPES } from '@tamanu/constants/settings';

import { centralDefaults, facilityDefaults, globalDefaults } from '../defaults';
import { Models, SettingsDBReader } from './readers/SettingsDBReader';
import { SettingsJSONReader } from './readers/SettingsJSONReader';

function getReaders(models: Models, facilityId?: string) {
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
  const readers = getReaders(models, facilityId);
  let settings = {};
  for (const reader of readers) {
    const value = await reader.getSettings();
    if (value) {
      // Prioritize the previous one
      settings = merge(value, settings);
    }
  }
  return settings;
}
