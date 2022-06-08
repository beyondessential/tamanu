import { Command } from 'commander';
import { log } from 'shared/services/logging';
import { Setting } from 'shared/models';
import { initDatabase } from '../database';

async function fetchSetting({ key }) {
  await initDatabase();

  const settingObject = await Setting.fetchSettingAsJSON(key);
  log.info(JSON.stringify(settingObject));
}

export const testSettingsCommand = new Command('testSettings')
  .description('Test command showing the dot notation settings model')
  .option('--key <string>', 'setting key', '')
  .action(fetchSetting);
