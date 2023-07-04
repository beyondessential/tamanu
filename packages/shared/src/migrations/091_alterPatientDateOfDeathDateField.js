import { DataTypes } from 'sequelize';

const TABLE_NAME = 'patients';
const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';

export async function up(query) {
  // 1. Create legacy columns
  await query.addColumn(TABLE_NAME, 'date_of_death_legacy', {
    type: DataTypes.DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`
    UPDATE ${TABLE_NAME}
    SET
      date_of_death_legacy = date_of_death;
  `);

  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN date_of_death TYPE date_time_string USING TO_CHAR(date_of_death, '${ISO9075_DATE_TIME_FMT}');
`);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN date_of_death TYPE timestamp with time zone USING date_of_death_legacy;
  `);
  await query.removeColumn(TABLE_NAME, 'date_of_death_legacy');
}
