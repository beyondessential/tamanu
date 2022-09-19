import { DataTypes } from 'sequelize';

const TABLE_NAME = 'lab_requests';
const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';

export async function up(query) {
  // 1. Create legacy columns
  await query.addColumn(TABLE_NAME, 'sample_time_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(TABLE_NAME, 'requested_date_legacy', {
    type: DataTypes.DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`
    UPDATE ${TABLE_NAME}
    SET
      sample_time_legacy = sample_time,
      requested_date_legacy = requested_date;
  `);

  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN sample_time TYPE CHAR(19) USING TO_CHAR(sample_time, '${ISO9075_DATE_TIME_FMT}'),
    ALTER COLUMN requested_date TYPE CHAR(19) USING TO_CHAR(requested_date, '${ISO9075_DATE_TIME_FMT}');
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN sample_time TYPE timestamp with time zone USING sample_time_legacy,
    ALTER COLUMN requested_date TYPE timestamp with time zone USING requested_date_legacy;
  `);
  await query.removeColumn(TABLE_NAME, 'sample_time_legacy');
  await query.removeColumn(TABLE_NAME, 'requested_date_legacy');
}
