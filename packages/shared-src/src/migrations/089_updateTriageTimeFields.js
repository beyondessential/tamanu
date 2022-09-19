import { DataTypes } from 'sequelize';

const TABLE_NAME = 'triages';
const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';

export async function up(query) {
  // 1. Create legacy columns
  await query.addColumn(TABLE_NAME, 'arrival_time_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(TABLE_NAME, 'triage_time_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(TABLE_NAME, 'closed_time_legacy', {
    type: DataTypes.DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`
      UPDATE ${TABLE_NAME}
      SET
          arrival_time_legacy = arrival_time,
          triage_time_legacy = triage_time,
          closed_time_legacy = closed_time;
    `);

  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(`
      ALTER TABLE ${TABLE_NAME}
      ALTER COLUMN arrival_time TYPE date_time_string
        USING TO_CHAR(arrival_time, '${ISO9075_DATE_TIME_FMT}'),
      ALTER COLUMN triage_time TYPE date_time_string
        USING TO_CHAR(triage_time, '${ISO9075_DATE_TIME_FMT}'),
      ALTER COLUMN closed_time TYPE date_time_string
        USING TO_CHAR(closed_time, '${ISO9075_DATE_TIME_FMT}');
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN arrival_time TYPE timestamp with time zone USING arrival_time_legacy,
    ALTER COLUMN triage_time TYPE timestamp with time zone USING triage_time_legacy,
    ALTER COLUMN closed_time TYPE timestamp with time zone USING closed_time_legacy;
  `);
  await query.removeColumn(TABLE_NAME, 'arrival_time_legacy');
  await query.removeColumn(TABLE_NAME, 'triage_time_legacy');
  await query.removeColumn(TABLE_NAME, 'closed_time_legacy');
}
