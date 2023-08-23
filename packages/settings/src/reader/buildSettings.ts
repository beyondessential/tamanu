import { merge } from 'lodash';

// TODO: use that from constants package
//import { SETTINGS_SCOPES } from '../constants';
import { centralDefaults } from '../defaults/central';
import { facilityDefaults } from '../defaults/facility';
import { globalDefaults } from '../defaults/global';
import { SettingsDBReader } from './readers/SettingsDBReader';
import { SettingsJSONReader } from './readers/SettingsJSONReader';

function getReaders(models, facilityId:string | undefined) {
  return facilityId
    ? [
      new SettingsDBReader(models, 'facility', facilityId),
      new SettingsDBReader(models, 'global'),
      new SettingsJSONReader(facilityDefaults),
      new SettingsJSONReader(globalDefaults),
    ]
    : [
      new SettingsDBReader(models, 'central'),
      new SettingsDBReader(models, 'global'),
      new SettingsJSONReader(centralDefaults),
      new SettingsJSONReader(globalDefaults),
    ];
}

export async function buildSettings(models, facilityId) {
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
