import { Command } from 'commander';
import config from 'config';
import { readFile } from 'fs/promises';
import { isArray, isObject } from 'lodash';
import { QueryTypes } from 'sequelize';
import { log } from '@tamanu/shared/services/logging';
import { initDatabase } from '../database';

const REMOVE_COMMENTS_REGEX = /[^:]\/\/.*/g;

const CONFIG_NAMES = {
  DEFAULT: 'default',
  LOCAL: 'local',
};

const readConfigFile = async name => {
  try {
    return await readFile(`config/${name}.json`);
  } catch (e) {
    throw new Error(`Failed to read ${name} config json ${e}`);
  }
};

const getDataFromEntries = (entries, prefix = '', keyIsIndex = false) => {
  const { serverFacilityId } = config;
  return entries.flatMap(([key, value]) => {
    const path = `${prefix}${keyIsIndex ? `[${key}]` : `${prefix && '.'}${key}`}`;
    return isObject(value)
      ? getDataFromEntries(Object.entries(value), path, isArray(value))
      : [[path, JSON.stringify(value), serverFacilityId]];
  });
};

async function loadSettings() {
  const context = await initDatabase();

  log.info(`Loading settings from config/${CONFIG_NAMES.DEFAULT}.json`);
  const defaultsFile = await readConfigFile(CONFIG_NAMES.DEFAULT);
  const defaultsJSON = JSON.parse(defaultsFile.toString().replace(REMOVE_COMMENTS_REGEX, ''));
  const data = getDataFromEntries(Object.entries(defaultsJSON));

  // Upsert data defaultValues and don't override anything
  // On conflict narrow to facility servers partial index including facilityId.
  log.info(`Populating defaults from ${data.length} entries`);
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
