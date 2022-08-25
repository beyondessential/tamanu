import { QueryInterface, DataTypes } from 'sequelize';
import { ISO9075_DATE_FORMAT } from '../constants';

const TABLE_NAME = 'patient_death_data';

export async function up(query: QueryInterface) {
  // 1. Create legacy columns
  await query.addColumn(TABLE_NAME, 'external_cause_date_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(TABLE_NAME, 'last_surgery_date_legacy', {
    type: DataTypes.DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`
    UPDATE ${TABLE_NAME}
    SET 
      external_cause_date_legacy = external_cause_date,
      last_surgery_date_legacy = last_surgery_date;
  `);

  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME} 
    ALTER COLUMN external_cause_date TYPE date_string 
      USING TO_CHAR(external_cause_date, '${ISO9075_DATE_FORMAT}'),
    ALTER COLUMN last_surgery_date TYPE date_time_string 
      USING TO_CHAR(last_surgery_date, '${ISO9075_DATE_FORMAT}');
`);
}

export async function down(query: QueryInterface) {
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN external_cause_date TYPE timestamp with time zone USING external_cause_date_legacy,
    ALTER COLUMN last_surgery_date TYPE timestamp with time zone USING last_surgery_date_legacy;
  `);
  await query.removeColumn(TABLE_NAME, 'external_cause_date_legacy');
  await query.removeColumn(TABLE_NAME, 'last_surgery_date_legacy');
}
