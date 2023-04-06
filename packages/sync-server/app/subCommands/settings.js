/* eslint-disable no-console */

import { promises as fs } from 'fs';
import { Command } from 'commander';
import TOML from '@iarna/toml';
import { canonicalize } from 'json-canonicalize';
import { buildSettingsRecords } from 'shared/models/Setting';

// it does work, but eslint doesn't like it
// eslint-disable-next-line import/no-unresolved
import { parse as parseJiK } from '@bgotink/kdl/json';

import { initDatabase } from '../database';

export async function listSettings(filter = '', { facility } = {}) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });

  const settingsTree = await Setting.get(filter, facility);
  if (!settingsTree || Object.keys(settingsTree).length === 0) {
    return 'No settings found';
  }

  const settings = buildSettingsRecords(filter, settingsTree, facility);

  const lines = settings.map(({ facilityId, key }) =>
    facilityId ? `${key} (facility: ${facilityId})` : key,
  );
  lines.sort();
  return lines.join('\n');
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
  await Setting.set(key, newValue, facility);
  return `${preValue}\nnew value set`;
}

export async function loadSettings(key, filepath, { facility, preview } = {}) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });

  if (key.length < 1) {
    throw new Error('Key must be specified');
  }

  const file = (await fs.readFile(filepath)).toString();
  let value;
  if (filepath.endsWith('.json')) {
    value = JSON.parse(file);
  } else if (filepath.endsWith('.toml')) {
    value = TOML.parse(file);
  } else if (filepath.endsWith('.kdl')) {
    value = parseJiK(file);
  } else {
    throw new Error('File format not supported');
  }

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
