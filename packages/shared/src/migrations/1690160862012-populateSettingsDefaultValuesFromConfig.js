import { readFile } from 'fs/promises';
import config from 'config';
import { isObject } from 'lodash';

const REMOVE_COMMENTS_REGEX = /[^:]\/\/.*/g;

const getDefaultConfig = async () => {
  try {
    return await readFile('config/default.json');
  } catch (e) {
    throw new Error(
      `Failed to migrate default settings with error reading config/default.json ${e}`,
    );
  }
};

const getDataFromEntries = (entries, prefix = '') => {
  const { serverFacilityId } = config;
  return entries.flatMap(([key, value]) => {
    const path = `${prefix}${!isNaN(Number(key)) ? `[${key}]` : `${prefix && '.'}${key}`}`;
    const stringifiedValue = JSON.stringify(value);
    return isObject(value)
      ? getDataFromEntries(Object.entries(value), path)
      : [
          [
            path,
            stringifiedValue,
            stringifiedValue,
            ...(serverFacilityId ? [serverFacilityId] : []),
          ],
        ];
  });
};

export async function up(query) {
  const { serverFacilityId } = config;

  const defaultsFile = await getDefaultConfig();
  const defaults = JSON.parse(defaultsFile.toString().replace(REMOVE_COMMENTS_REGEX, ''));
  const data = getDataFromEntries(Object.entries(defaults));

  // Upsert data defaultValues and don't override anything
  // On conflict references one of two partial unique indexes based on server context.
  if (serverFacilityId) {
    await query.sequelize.query(
      `
        INSERT INTO settings (key, default_value, value, facility_id)
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
        INSERT INTO settings (key, default_value, value)
        VALUES ${data.map(() => '(?)').join(', ')}
        ON CONFLICT (key) WHERE key IS NOT NULL AND facility_id IS NULL AND deleted_at IS NULL
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
  const { serverFacilityId } = config;
  const defaultsFile = await getDefaultConfig();
  const defaults = JSON.parse(defaultsFile.toString().replace(REMOVE_COMMENTS_REGEX, ''));
  const data = getDataFromEntries(Object.entries(defaults));
  await query.sequelize.query(
    `
      DELETE FROM settings
      WHERE key IN (:keys) AND value = default_value and facility_id = :serverFacilityId
    `,
    {
      replacements: {
        keys: data.map(([key]) => key),
        serverFacilityId: serverFacilityId || null,
      },
      type: query.sequelize.QueryTypes.DELETE,
    },
  );
}
