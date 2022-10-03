import { QueryTypes, DataTypes } from 'sequelize';
import config from 'config';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';

const alterSchemaOnly = async (query, table, field) => {
  // Change column types from of original columns from date to string
  return query.sequelize.query(`
      ALTER TABLE ${table}
      ALTER COLUMN ${field} TYPE date_time_string;
    `);
};

const alterSchemaAndBackUpLegacyData = async (query, table, field) => {
  const COUNTRY_TIMEZONE = config?.countryTimeZone;

  if (!COUNTRY_TIMEZONE) {
    throw Error('A countryTimeZone must be configured in local.json for this migration to run.');
  }

  // Copy data to legacy columns for backup
  await query.sequelize.query(`
      UPDATE ${table}
      SET
          ${field}_legacy = ${field};
  `);

  // Change column types from of original columns from date to string & convert data to string
  return query.sequelize.query(`
    ALTER TABLE ${table}
    ALTER COLUMN ${field} TYPE date_time_string
    USING TO_CHAR(${field}::TIMESTAMPTZ AT TIME ZONE '${COUNTRY_TIMEZONE}', '${ISO9075_DATE_TIME_FMT}');
  `);
};

export async function up(query) {
  // 1. Create legacy columns
  await query.addColumn('procedures', `end_time_legacy`, {
    type: DataTypes.DATE,
  });

  const legacyDataCount = await query.sequelize.query(
    `SELECT COUNT(*) FROM procedures WHERE end_time IS NOT NULL;`,
    {
      type: QueryTypes.SELECT,
    },
  );

  if (legacyDataCount === 0) {
    await alterSchemaOnly(query, 'procedures', 'end_time');
  } else {
    await alterSchemaAndBackUpLegacyData(query, 'procedures', 'end_time');
  }
  // Special case for start_time which was added as a variable character string
  // It needs no legacy column, but needs to be converted to a date_time_string
  await alterSchemaOnly(query, 'procedures', 'start_time');
}

export async function down(query) {
  // Special case for start_time see above
  await query.changeColumn('procedures', 'start_time', {
    type: DataTypes.STRING,
  });
  await query.sequelize.query(`
      ALTER TABLE procedures
      ALTER COLUMN end_time TYPE timestamp with time zone USING end_time_legacy;`);
  await query.removeColumn('procedures', 'end_time_legacy');
}
