import { Command } from 'commander';
import { Op } from 'sequelize';

import { log } from 'shared/services/logging';

import { initDatabase } from '../database';

async function listSettings(filter = null) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });
  log.info('---------------------------------\n');

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
    log.info('No settings found');
    return;
  }

  for (const setting of settings) {
    log.info(setting.key);
  }
}

async function getSetting(key, { facility }) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });
  log.info('---------------------------------\n');

  const setting = await Setting.get(key, facility);
  if (setting === undefined) {
    log.info('(no setting found)');
  } else {
    log.info(`value: ${JSON.stringify(setting, null, 2)}`);
  }
}

async function setSetting(key, value, { facility }) {
  const {
    models: { Setting },
  } = await initDatabase({ testMode: false });
  log.info('---------------------------------\n');

  const setting = await Setting.get(key, facility);
  if (setting && JSON.stringify(setting) !== '{}') {
    log.info('current value:');
    log.info(JSON.stringify(setting, null, 2));
    log.info('\n')
  } else {
    log.info('no current value\n');
  }

  const newValue = JSON.parse(value);
  await Setting.set(key, newValue, facility);
  log.info('new value set');
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
