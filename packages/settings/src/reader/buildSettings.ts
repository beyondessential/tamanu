import { merge } from 'lodash';

// TODO: use that from constants package
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { centralDefaults } from '../defaults/central';
import { facilityDefaults } from '../defaults/facility';
import { globalDefaults } from '../defaults/global';
import { SettingsDBReader } from './readers/SettingsDBReader';
import { SettingsJSONReader } from './readers/SettingsJSONReader';

function getReaders(models: any, facilityId: string | undefined) {
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

export async function buildSettings(models: any, facilityId: any) {
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
