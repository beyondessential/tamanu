/* eslint-disable @typescript-eslint/no-explicit-any */
import { merge } from 'lodash';
import { SETTINGS_SCOPES } from '@tamanu/constants';

import { centralDefaults, facilityDefaults, globalDefaults } from '../defaults';
import { Models, SettingsDBReader } from './readers/SettingsDBReader';
import { SettingsJSONReader } from './readers/SettingsJSONReader';
import { ConfigReader } from './readers/ConfigReader';

function getReaders(models: Models, facilityId?: string, config?: any) {
  return facilityId
    ? [
      new SettingsDBReader(models, SETTINGS_SCOPES.FACILITY, facilityId),
      new SettingsDBReader(models, SETTINGS_SCOPES.GLOBAL),
      new ConfigReader(config),
      new SettingsJSONReader(facilityDefaults),
      new SettingsJSONReader(globalDefaults),
    ]
    : [
      new SettingsDBReader(models, SETTINGS_SCOPES.CENTRAL),
      new SettingsDBReader(models, SETTINGS_SCOPES.GLOBAL),
      new ConfigReader(config),
      new SettingsJSONReader(centralDefaults),
      new SettingsJSONReader(globalDefaults),
    ];
}

type BuildSettingsProps = {
  models: Models;
  facilityId?: string;
  config?: any;
};

export async function buildSettings({ models, facilityId, config }: BuildSettingsProps) {
  const readers = getReaders(models, facilityId, config);
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
