/* eslint-disable no-console */

import { Command } from 'commander';
import { Op } from 'sequelize';

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
      .option('--facility', 'ID of facility to scope to')
      .action(getSetting),
  )
  .addCommand(
    new Command('set')
      .description('set a setting')
      .argument('<key>', 'key to create/update')
      .argument('<value>', 'value in JSON')
      .option('--facility', 'ID of facility to scope to')
      .action(setSetting),
  );
