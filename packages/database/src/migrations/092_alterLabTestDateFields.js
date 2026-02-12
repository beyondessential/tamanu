import { DataTypes, QueryTypes } from 'sequelize';
import config from 'config';

const ISO9075_DATE_FMT = 'YYYY-MM-DD';
const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';

const MIGRATIONS = [
  { TABLE: 'lab_tests', FIELD: 'date', TYPE: 'date_string' },
  { TABLE: 'lab_tests', FIELD: 'completed_date', TYPE: 'date_time_string' },
];

const alterSchemaOnly = async (query, table, field, type) => {
  // Change column types from of original columns from date to string
  return query.sequelize.query(`
      ALTER TABLE ${table}
      ALTER COLUMN ${field} TYPE ${type};
    `);
};

const alterSchemaAndBackUpLegacyData = async (query, table, field, type) => {
  const PRIMARY_TIME_ZONE = config?.primaryTimeZone;

  if (!PRIMARY_TIME_ZONE) {
    throw Error('A primaryTimeZone must be configured in local.json5 for this migration to run.');
  }

  // Copy data to legacy columns for backup
  await query.sequelize.query(`
      UPDATE ${table}
      SET
          ${field}_legacy = ${field};
  `);

  // Change column types from of original columns from date to string & convert data to string
  const iso9075Format = type === 'date_time_string' ? ISO9075_DATE_TIME_FMT : ISO9075_DATE_FMT;

  return query.sequelize.query(`
    ALTER TABLE ${table}
    ALTER COLUMN ${field} TYPE ${type}
    USING TO_CHAR(${field}::TIMESTAMPTZ AT TIME ZONE '${PRIMARY_TIME_ZONE}', '${iso9075Format}');
  `);
};

export async function up(query) {
  for (const migration of MIGRATIONS) {
    // Create legacy columns
    await query.addColumn(migration.TABLE, `${migration.FIELD}_legacy`, {
      type: DataTypes.DATE,
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
      await alterSchemaOnly(query, migration.TABLE, migration.FIELD, migration.TYPE);
    } else {
      await alterSchemaAndBackUpLegacyData(query, migration.TABLE, migration.FIELD, migration.TYPE);
    }
  }
}

export async function down(query) {
  for (const migration of MIGRATIONS) {
    await query.sequelize.query(`
      ALTER TABLE ${migration.TABLE}
      ALTER COLUMN ${migration.FIELD} TYPE timestamp with time zone USING ${migration.FIELD}_legacy;
    `);
    await query.removeColumn(migration.TABLE, `${migration.FIELD}_legacy`);
  }
}
