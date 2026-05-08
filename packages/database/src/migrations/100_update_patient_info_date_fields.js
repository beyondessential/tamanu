import { DataTypes } from 'sequelize';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';
const MIGRATIONS = [
  { TABLE: 'patient_allergies', FIELD: 'recorded_date' },
  { TABLE: 'patient_care_plans', FIELD: 'date' },
  { TABLE: 'patient_conditions', FIELD: 'recorded_date' },
  { TABLE: 'patient_family_histories', FIELD: 'recorded_date' },
  { TABLE: 'patient_issues', FIELD: 'recorded_date' },
];

export async function up(query) {
  for (const migration of MIGRATIONS) {
    // 1. Create legacy columns
    await query.addColumn(migration.TABLE, `${migration.FIELD}_legacy`, {
      type: DataTypes.DATE,
    });

    // 2. Copy data to legacy columns for backup
    await query.sequelize.query(`
      UPDATE ${migration.TABLE}
      SET
      ${migration.FIELD}_legacy = ${migration.FIELD};
    `);

    // 3.Change column types from of original columns from date to string & convert data to string
    await query.sequelize.query(`
      ALTER TABLE ${migration.TABLE}
      ALTER COLUMN ${migration.FIELD} TYPE date_time_string
      USING TO_CHAR(${migration.FIELD}::TIMESTAMPTZ AT TIME ZONE 'UTC', '${ISO9075_DATE_TIME_FMT}');
    `);
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
