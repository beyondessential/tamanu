import { DataTypes, QueryTypes } from 'sequelize';
import config from 'config';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';
const MIGRATIONS = [
  {
    TABLE: 'procedures',
    FIELD: 'start_time',
    LEGACY_TYPE: { sequelize: DataTypes.STRING, postgres: 'character varying(255)' },
  },
  { TABLE: 'procedures', FIELD: 'end_time' },
];

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
  for (const migration of MIGRATIONS) {
    // Create legacy columns
    await query.addColumn(migration.TABLE, `${migration.FIELD}_legacy`, {
      type: migration.LEGACY_TYPE?.sequelize || DataTypes.DATE,
    });

    // Check for legacy data
    // Check if there is any legacy data in the system
    // For example, newly deployed instances of tamanu won't have legacy data
    const countResult = await query.sequelize.query(
      `SELECT COUNT(*) FROM ${migration.TABLE} WHERE ${migration.FIELD} IS NOT NULL;`,
      {
        type: QueryTypes.SELECT,
      },
    );

    // If there is no legacy column data, then we don't need to run the data migration or check
    // for the timezone in the config
    if (parseInt(countResult[0].count, 10) === 0) {
      await alterSchemaOnly(query, migration.TABLE, migration.FIELD);
    } else {
      await alterSchemaAndBackUpLegacyData(query, migration.TABLE, migration.FIELD);
    }
  }
}

export async function down(query) {
  for (const migration of MIGRATIONS) {
    await query.sequelize.query(`
      ALTER TABLE ${migration.TABLE}
      ALTER COLUMN ${migration.FIELD} TYPE ${
        migration.LEGACY_TYPE?.postgres || 'timestamp with time zone'
      } USING ${migration.FIELD}_legacy;
    `);
    await query.removeColumn(migration.TABLE, `${migration.FIELD}_legacy`);
  }
}
