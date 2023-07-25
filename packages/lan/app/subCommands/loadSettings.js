import { Command } from 'commander';
import config from 'config';
import { QueryTypes } from 'sequelize';
import { log } from '@tamanu/shared/services/logging';
import { initDatabase } from '../database';
import { CONFIG_ENVS, getInsertDataFromConfigFile } from '../../../shared/src/utils';

async function loadSettings() {
  const context = await initDatabase();

  log.info(`Reading settings from config/default.json`);
  const data = await getInsertDataFromConfigFile(CONFIG_ENVS.DEFAULT, config.serverFacilityId);

  log.info(`Populating ${data.length} settings from config/default.json`);
  const res = await context.sequelize.query(
    `
      INSERT INTO settings (key, default_value, facility_id)
      VALUES ${data.map(() => '(?)').join(', ')}
      ON CONFLICT (key, facility_id) WHERE key IS NOT NULL AND facility_id IS NOT NULL AND deleted_at IS NULL
      DO UPDATE SET default_value = EXCLUDED.default_value;
    `,
    {
      replacements: data,
      type: QueryTypes.INSERT,
    },
  );

  log.info(`Successfully loaded ${res[1]} settings from config/default.json`);

  process.exit(0);
}

export const loadSettingsCommand = new Command('loadSettings')
  .description('Load settings from config')
  .action(loadSettings);
