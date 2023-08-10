import config from 'config';
import { SETTINGS_SCOPES } from '../constants';
import { centralDefaults } from '../settings/central';
import { facilityDefaults } from '../settings/facility';
import { globalDefaults } from '../settings/global';
import { SettingsDBReader } from './readers/SettingsDBReader';
import { SettingsJSONReader } from './readers/SettingsJSONReader';

function getReaders(models) {
  const facilityId = config.serverFacilityId;
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

export async function buildSettings(models) {
  const readers = getReaders(models);
  let settings = {};
  for (const reader of readers) {
    const value = await reader.getSettings();
    // console.log({ reader, value });
    if (value) {
      // Prioritize the previous one
      settings = { ...value, ...settings };
    }
  }
  console.log({ settings });

  return settings;
}
