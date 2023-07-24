import { DataTypes } from 'sequelize';
import { readFile } from 'fs/promises';
import config from 'config';
import { isObject } from 'lodash';

const REMOVE_COMMENT_REGEX = /(\/\/(?!(.*)"\s*,).*\n)+/g;

export async function up(query) {
  const { serverFacilityId } = config;
  const getDataFromEntries = (entries, prefix = '') =>
    entries.flatMap(([key, value]) => {
      const path = `${prefix}${!isNaN(Number(key)) ? `[${key}]` : `${prefix && '.'}${key}`}`;
      return isObject(value)
        ? getDataFromEntries(Object.entries(value), path)
        : [
            {
              key: path,
              defaultValue: value,
              facilityId: serverFacilityId,
            },
          ];
    });
  const defaultsFile = await readFile('config/default.json');
  const defaults = JSON.parse(defaultsFile.toString().replace(REMOVE_COMMENT_REGEX, '\n'));
  const data = getDataFromEntries(Object.entries(defaults));

  // Upsert data defaultValues and don't override anything
  // On conflict includes where claus to deal with partial indexes
  await query.sequelize.query(`
    INSERT INTO settings (key, facility_id, default_value)
    VALUES ${data
      .map(
        ({ key, defaultValue, facilityId }) =>
          `('${key}', '${facilityId}', '${JSON.stringify(defaultValue)}')`,
      )
      .join(', ')}
    ON CONFLICT (key, facility_id) WHERE key IS NOT NULL AND facility_id IS NOT NULL AND deleted_at IS NULL
    DO UPDATE SET default_value = EXCLUDED.default_value;
  `);
}

export async function down(query) {
}
