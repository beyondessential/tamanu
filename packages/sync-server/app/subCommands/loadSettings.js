import { Command } from 'commander';
import { QueryTypes } from 'sequelize';
import { log } from '@tamanu/shared/services/logging';
import { CONFIG_ENVS, getInsertDataFromConfigFile } from '@tamanu/shared/utils';
import { initDatabase } from '../database';

async function loadSettings() {
  const context = await initDatabase({ testMode: false });

  log.info(`Reading settings from config/default.json`);
  const data = await getInsertDataFromConfigFile(CONFIG_ENVS.DEFAULT);

  log.info(`Populating ${data.length} settings from config/default.json`);

  // Upsert data defaultValues and don't override anything
  // On conflict narrows down to one of two partial unique indexes based on central server context.
  const res = await context.sequelize.query(
    `
     INSERT INTO settings (key, default_value)
     VALUES ${data.map(() => '(?)').join(', ')}
     ON CONFLICT (key) WHERE key IS NOT NULL AND facility_id IS NULL AND deleted_at IS NULL
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
