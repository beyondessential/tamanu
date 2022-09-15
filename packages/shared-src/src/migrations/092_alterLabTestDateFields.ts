import { QueryInterface, DataTypes } from 'sequelize';

const TABLE_NAME = 'lab_tests';
const ISO9075_DATE_FMT = 'YYYY-MM-DD';
const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';

export async function up(query: QueryInterface) {
  // 1. Create legacy columns
  await query.addColumn(TABLE_NAME, 'date_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(TABLE_NAME, 'completed_date_legacy', {
    type: DataTypes.DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`
    UPDATE ${TABLE_NAME}
    SET
      date_legacy = date;
  `);
  await query.sequelize.query(`
    UPDATE ${TABLE_NAME}
    SET
      completed_date_legacy = completed_date;
  `);

  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN date TYPE date_string USING TO_CHAR(date, '${ISO9075_DATE_FMT}');
  `);
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN completed_date TYPE date_time_string USING TO_CHAR(completed_date, '${ISO9075_DATE_TIME_FMT}');
  `);
}

export async function down(query: QueryInterface) {
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN date TYPE timestamp with time zone USING date_legacy;
  `);
  await query.removeColumn(TABLE_NAME, 'date_legacy');

  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN completed_date TYPE timestamp with time zone USING completed_date_legacy;
  `);
  await query.removeColumn(TABLE_NAME, 'completed_date_legacy');
}
