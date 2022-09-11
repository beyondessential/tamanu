import { QueryInterface, DataTypes } from 'sequelize';

const TABLE_NAME = 'lab_tests';
const ISO9075_DATE_FMT = 'YYYY-MM-DD';

export async function up(query: QueryInterface) {
  // 1. Create legacy columns
  await query.addColumn(TABLE_NAME, 'date_legacy', {
    type: DataTypes.DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`
    UPDATE ${TABLE_NAME}
    SET 
      date_legacy = date;
  `);

  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME} 
    ALTER COLUMN date TYPE date_string USING TO_CHAR(date, '${ISO9075_DATE_FMT}');
  `);
}

export async function down(query: QueryInterface) {
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN date TYPE timestamp with time zone USING date_legacy;
  `);
  await query.removeColumn(TABLE_NAME, 'date_legacy');
}
