import { DataTypes } from 'sequelize';

const ISO9075_DATE_FMT = 'YYYY-MM-DD';
const TABLE_NAME = 'patients';

export async function up(query) {
  // 1. Create legacy columns
  await query.addColumn(TABLE_NAME, 'date_of_birth_legacy', {
    type: DataTypes.DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`
      UPDATE ${TABLE_NAME}
      SET
          date_of_birth_legacy = date_of_birth;
    `);
  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(`
      ALTER TABLE ${TABLE_NAME}
      ALTER COLUMN date_of_birth TYPE date_string
      USING TO_CHAR(date_of_birth, '${ISO9075_DATE_FMT}');
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN date_of_birth TYPE timestamp with time zone USING date_of_birth_legacy;
  `);
  await query.removeColumn(TABLE_NAME, 'date_of_birth_legacy');
}
