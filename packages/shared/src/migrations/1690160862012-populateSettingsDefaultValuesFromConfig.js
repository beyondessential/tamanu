import { readFile } from 'fs/promises';
import config from 'config';
import { isObject } from 'lodash';

const REMOVE_COMMENTS_REGEX = /(\/\/(?!(.*)"\s*,).*\n)+/g;

export async function up(query) {
  const { serverFacilityId } = config;
  const getDataFromEntries = (entries, prefix = '') =>
    entries.flatMap(([key, value]) => {
      const path = `${prefix}${!isNaN(Number(key)) ? `[${key}]` : `${prefix && '.'}${key}`}`;
      return isObject(value)
        ? getDataFromEntries(Object.entries(value), path)
        : [[path, serverFacilityId, JSON.stringify(value)]];
    });
  const defaultsFile = await readFile('config/bigdog.json');
  if (!defaultsFile) {
    throw new Error('Could not find config/default.json');
  }
  const defaults = JSON.parse(defaultsFile.toString().replace(REMOVE_COMMENTS_REGEX, '\n'));
  const data = getDataFromEntries(Object.entries(defaults));

  // Upsert data defaultValues and don't override anything
  // On conflict references one of two partial unique indexes based on server context.
  if (serverFacilityId) {
    await query.sequelize.query(
      `
        INSERT INTO settings (key, facility_id, default_value)
        VALUES ${data.map(() => '(?)').join(', ')}
        ON CONFLICT (key, facility_id) WHERE key IS NOT NULL AND facility_id IS NOT NULL AND deleted_at IS NULL
        DO UPDATE SET default_value = EXCLUDED.default_value;
      `,
      {
        replacements: data,
        type: query.sequelize.QueryTypes.INSERT,
      },
    );
  } else {
    await query.sequelize.query(
      `
        INSERT INTO settings (key, default_value)
        VALUES ${data.map(() => '(?)').join(', ')}
        ON CONFLICT (key) WHERE key IS NOT NULL AND deleted_at IS NULL
        DO UPDATE SET default_value = EXCLUDED.default_value;
      `,
      {
        replacements: data,
        type: query.sequelize.QueryTypes.INSERT,
      },
    );
  }
}

export async function down(query) {
  // No down migration
}
