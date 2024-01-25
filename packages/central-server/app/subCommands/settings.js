/* eslint-disable no-console */

import { Command } from 'commander';
import { canonicalize } from 'json-canonicalize';

import { initDatabase } from '../database';
import { loadSettingFile } from '../utils/loadSettingFile';

export async function getSetting({ store }, key, { facility, scope } = {}) {
  const {
    models: { Setting },
  } = store;

  const setting = await Setting.get(key, facility, scope);
  if (setting === undefined) {
    return '(no setting found)';
  }

  return `value:\n${canonicalize(setting)}`;
}

export async function setSetting({ store }, key, value, { facility, scope } = {}) {
  const {
    models: { Setting },
  } = store;

  const setting = await Setting.get(key, facility, scope);
  const preValue =
    setting && JSON.stringify(setting) !== '{}'
      ? `current value:\n${canonicalize(setting)}\n`
      : 'no current value\n';

  const newValue = JSON.parse(value);
  await Setting.set(key, newValue, scope, facility);
  return `${preValue}\nnew value set`;
}

export async function loadSettings({ store }, key, filepath, { facility, preview, scope } = {}) {
  const {
    models: { Setting },
  } = store;
  if (key.length < 1) {
    throw new Error('Key must be specified');
  }

  const value = await loadSettingFile(filepath);
  if (preview) {
    return JSON.stringify(value, null, 2);
  }

  await Setting.set(key, value, scope, facility);

  const currentValue = await Setting.get(key, facility, scope);
  return JSON.stringify(currentValue, null, 2);
}

const commandWithContext = action => {
  return async (...args) => {
    const store = await initDatabase({ testMode: false });
    return action({ store }, ...args);
  };
};

export const settingsCommand = new Command('settings')
  .description('Manage settings')
  .addCommand(
    new Command('get')
      .description('get a setting')
      .argument('<key>', 'key to retrieve')
      .option('--scope <scope>', 'scope to retrieve setting for')
      .option('--facility <facility>', 'ID of facility to scope to')
      .action(async (...args) =>
        console.log(`-------------------------\n${await commandWithContext(getSetting)(...args)}`),
      ),
  )
  .addCommand(
    new Command('set')
      .description('set a setting')
      .argument('<key>', 'key to create/update')
      .argument('<value>', 'value in JSON')
      .option('--scope <scope>', 'scope to set setting for')
      .option('--facility <facility>', 'ID of facility to scope to')
      .action(async (...args) =>
        console.log(`-------------------------\n${await commandWithContext(setSetting)(...args)}`),
      ),
  )
  .addCommand(
    new Command('load')
      .description('load settings from a file')
      .argument('<key>', 'key to load to')
      .argument('<file>', 'JSON, TOML, or KDL file to load settings from')
      .option('--scope <scope>', 'scope to load settings for')
      .option('--facility <facility>', 'ID of facility to scope to')
      .option('--preview', 'Print the settings that would be loaded in JSON')
      .action(async (...args) =>
        console.log(
          `-------------------------\n${await commandWithContext(loadSettings)(...args)}`,
        ),
      ),
  );
