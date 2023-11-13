/* eslint-disable no-console */

import { Command } from 'commander';
import { canonicalize } from 'json-canonicalize';
import { buildSettingsRecords } from '@tamanu/shared/models/Setting';

import { initDatabase } from '../database';
import { loadSettingFile } from '../utils/loadSettingFile';

export async function listSettings(filter = '', { facility } = {}) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });

  const globalTree = await Setting.get(filter);
  const globalSettings = buildSettingsRecords(filter, globalTree, null);

  if (!facility) {
    if (!globalTree || Object.keys(globalTree).length === 0) {
      return 'No settings found';
    }

    return globalSettings
      .map(({ key }) => key)
      .sort()
      .join('\n');
  }

  const facilityTree = await Setting.get(filter, facility);
  if (!facilityTree || Object.keys(facilityTree).length === 0) {
    return 'No settings found';
  }

  const facilitySettings = buildSettingsRecords(filter, facilityTree, facility);

  const globalKeys = new Set(globalSettings.map(({ key }) => key));

  return [...globalSettings, ...facilitySettings]
    .map(({ facilityId, key }) => {
      if (facilityId) {
        if (globalKeys.has(key)) return null;
        return `${key} (facility only)`;
      }

      return key;
    })
    .filter(Boolean)
    .sort()
    .join('\n');
}

export async function getSetting(key, { facility } = {}) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });

  const setting = await Setting.get(key, facility);
  if (setting === undefined) {
    return '(no setting found)';
  }

  return `value:\n${canonicalize(setting)}`;
}

export async function setSetting(key, value, { facility } = {}) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });

  const setting = await Setting.get(key, facility);
  const preValue =
    setting && JSON.stringify(setting) !== '{}'
      ? `current value:\n${canonicalize(setting)}\n`
      : 'no current value\n';

  const newValue = JSON.parse(value);
  await Setting.set(key, newValue, null, facility);
  return `${preValue}\nnew value set`;
}

export async function loadSettings(key, filepath, { facility, preview } = {}) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });

  if (key.length < 1) {
    throw new Error('Key must be specified');
  }

  const value = await loadSettingFile(filepath);
  if (preview) {
    return JSON.stringify(value, null, 2);
  }

  await Setting.set(key, value, facility);

  const currentValue = await Setting.get(key, facility);
  return JSON.stringify(currentValue, null, 2);
}

export const settingsCommand = new Command('settings')
  .description('Manage settings')
  .addCommand(
    new Command('list')
      .description('list all setting keys')
      .argument('[filter]', 'only output keys matching this')
      .option('--facility <facility>', 'ID of facility to scope to')
      .action(async (...args) =>
        console.log(`-------------------------\n${await listSettings(...args)}`),
      ),
  )
  .addCommand(
    new Command('get')
      .description('get a setting')
      .argument('<key>', 'key to retrieve')
      .option('--facility <facility>', 'ID of facility to scope to')
      .action(async (...args) =>
        console.log(`-------------------------\n${await getSetting(...args)}`),
      ),
  )
  .addCommand(
    new Command('set')
      .description('set a setting')
      .argument('<key>', 'key to create/update')
      .argument('<value>', 'value in JSON')
      .option('--facility <facility>', 'ID of facility to scope to')
      .action(async (...args) =>
        console.log(`-------------------------\n${await setSetting(...args)}`),
      ),
  )
  .addCommand(
    new Command('load')
      .description('load settings from a file')
      .argument('<key>', 'key to load to')
      .argument('<file>', 'JSON, TOML, or KDL file to load settings from')
      .option('--facility <facility>', 'ID of facility to scope to')
      .option('--preview', 'Print the settings that would be loaded in JSON')
      .action(async (...args) =>
        console.log(`-------------------------\n${await loadSettings(...args)}`),
      ),
  );
