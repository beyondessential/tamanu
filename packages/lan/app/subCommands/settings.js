/* eslint-disable no-console */

import { Command } from 'commander';
import { QueryTypes } from 'sequelize';
import { CONFIG_ENVS, getSettingDataFromConfigFile } from '@tamanu/shared/utils';
import config from 'config';

import { initDatabase } from '../database';

async function initSettings({ preview }) {
  const context = await initDatabase();
  const data = await getSettingDataFromConfigFile(CONFIG_ENVS.DEFAULT, config.serverFacilityId);

  if (preview) {
    return data
      .map(
        ([key, defaultValue, facilityId]) =>
          `\x1b[1m${key}:\x1b[0m default_value: ${defaultValue}, facility_id: ${facilityId}`,
      )
      .join('\n');
  }

  // Upsert data defaultValues and don't override anything
  // On conflict narrows down to one of two partial unique indexes based on facility server context.
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

  return `Initialized ${res[1]} settings from config/default.json`;
}

export const settingsCommand = new Command('settings').description('Manage settings').addCommand(
  new Command('init')
    .description('Initialize settings from config json files')
    .option('--preview', 'Print the settings that will be loaded')
    .action(async (...args) =>
      console.log(`-------------------------\n${await initSettings(...args)}`),
    ),
);
