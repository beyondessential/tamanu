import { DataTypes, QueryTypes } from 'sequelize';
import config from 'config';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';
const MIGRATIONS = [
  { TABLE: 'document_metadata', FIELD: 'document_created_at' },
  { TABLE: 'document_metadata', FIELD: 'document_uploaded_at' },
];

const alterSchemaOnly = async (query, table, field) => {
  // Change column types from of original columns from date to string
  return query.sequelize.query(`
      ALTER TABLE ${table}
      ALTER COLUMN ${field} TYPE date_time_string;
    `);
};

const alterSchemaAndBackUpLegacyData = async (query, table, field) => {
  const GLOBAL_TIME_ZONE = config?.globalTimeZone;

  if (!GLOBAL_TIME_ZONE) {
    throw Error('A globalTimeZone must be configured in local.json5 for this migration to run.');
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
    USING TO_CHAR(${field}::TIMESTAMPTZ AT TIME ZONE '${GLOBAL_TIME_ZONE}', '${ISO9075_DATE_TIME_FMT}');
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
    const legacyDataCount = await query.sequelize.query(
      `SELECT COUNT(*) FROM ${migration.TABLE} WHERE ${migration.FIELD}_legacy IS NOT NULL;`,
      {
        type: QueryTypes.SELECT,
      },
    );

    // If there is no legacy column data, then we don't need to run the data migration or check
    // for the timezone in the config
    if (legacyDataCount === 0) {
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
