import { DataTypes, QueryTypes } from 'sequelize';
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
  return query.sequelize.query(`
    ALTER TABLE ${table}
    ALTER COLUMN ${field} TYPE date_time_string
    USING TO_CHAR(${field}::TIMESTAMPTZ AT TIME ZONE '${PRIMARY_TIME_ZONE}', '${ISO9075_DATE_TIME_FMT}');
  `);
};

export async function up(query) {
  // 1. Create legacy columns
  await query.addColumn('patient_birth_data', `time_of_birth_legacy`, {
    type: DataTypes.STRING,
  });

  const countResult = await query.sequelize.query(
    `SELECT COUNT(*) FROM patient_birth_data WHERE time_of_birth IS NOT NULL;`,
    {
      type: QueryTypes.SELECT,
    },
  );

  if (parseInt(countResult[0].count, 10) === 0) {
    await alterSchemaOnly(query, 'patient_birth_data', 'time_of_birth');
  } else {
    await alterSchemaAndBackUpLegacyData(query, 'patient_birth_data', 'time_of_birth');
  }
}

export async function down(query) {
  await query.changeColumn('patient_birth_data', 'time_of_birth', {
    type: DataTypes.STRING,
  });
  await query.sequelize.query(`
      ALTER TABLE patient_birth_data
      ALTER COLUMN time_of_birth type character varying(255) USING time_of_birth_legacy;`);
  await query.removeColumn('patient_birth_data', 'time_of_birth_legacy');
}
