/* eslint-disable no-console */

import { promises as fs } from 'fs';
import { Command } from 'commander';
import { Op } from 'sequelize';
import TOML from '@iarna/toml';

// it does work, but eslint doesn't like it
// eslint-disable-next-line import/no-unresolved
import { parse as parseJiK } from '@bgotink/kdl/json';

import { initDatabase } from '../database';

async function listSettings(filter = null) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });
  console.log('---------------------------------\n');

  const settings = await Setting.findAll({
    where: filter
      ? {
          key: {
            [Op.iLike]: `%${filter}%`,
          },
        }
      : {},
  });

  if (settings.length === 0) {
    console.log('No settings found');
    return;
  }

  for (const setting of settings) {
    console.log(setting.key);
  }
}

async function getSetting(key, { facility }) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });
  console.log('---------------------------------\n');

  const setting = await Setting.get(key, facility);
  if (setting === undefined) {
    console.log('(no setting found)');
  } else {
    console.log(`value: ${JSON.stringify(setting, null, 2)}`);
  }
}

async function setSetting(key, value, { facility }) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });
  console.log('---------------------------------\n');

  const setting = await Setting.get(key, facility);
  if (setting && JSON.stringify(setting) !== '{}') {
    console.log('current value:');
    console.log(JSON.stringify(setting, null, 2));
    console.log('\n');
  } else {
    console.log('no current value\n');
  }

  const newValue = JSON.parse(value);
  await Setting.set(key, newValue, facility);
  console.log('new value set');
}

async function loadSettings(key, filepath, { facility, preview }) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });
  console.log('---------------------------------\n');

  if (key.length < 1) {
    console.error('Key must be specified');
    return;
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
    console.error('File format not supported');
    return;
  }

  if (preview) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }

  console.log(`Setting ${key}...`);
  await Setting.set(key, value, facility);

  const currentValue = await Setting.get(key, facility);
  console.log(JSON.stringify(currentValue, null, 2));
}

export const settingsCommand = new Command('settings')
  .description('Manage settings')
  .addCommand(
    new Command('list')
      .description('list all setting keys')
      .argument('[filter]', 'only output keys matching this')
      .action(listSettings),
  )
  .addCommand(
    new Command('get')
      .description('get a setting')
      .argument('<key>', 'key to retrieve')
      .option('--facility <facility>', 'ID of facility to scope to')
      .action(getSetting),
  )
  .addCommand(
    new Command('set')
      .description('set a setting')
      .argument('<key>', 'key to create/update')
      .argument('<value>', 'value in JSON')
      .option('--facility <facility>', 'ID of facility to scope to')
      .action(setSetting),
  )
  .addCommand(
    new Command('load')
      .description('load settings from a file')
      .argument('<key>', 'key to load to')
      .argument('<file>', 'JSON or TOML file to load settings from')
      .option('--facility <facility>', 'ID of facility to scope to')
      .option('--preview', 'Print the settings that would be loaded in JSON')
      .action(loadSettings),
  );
