import { DataTypes, QueryInterface } from 'sequelize';
import { ISO9075_DATETIME_FORMAT } from '../constants';

const TABLE_NAME = 'appointments';

export async function up(query: QueryInterface) {
  await query.addColumn(TABLE_NAME, 'start_time_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(TABLE_NAME, 'end_time_legacy', {
    type: DataTypes.DATE,
  });

  await query.sequelize.query(`
    UPDATE ${TABLE_NAME}
    SET 
      start_time_legacy = start_time,
      end_time_legacy = end_time;
  `);
  await query.sequelize.query(`
  ALTER TABLE ${TABLE_NAME} 
  ALTER COLUMN start_time TYPE CHAR(19) USING TO_CHAR(start_time, '${ISO9075_DATETIME_FORMAT}'),
  ALTER COLUMN end_time TYPE CHAR(19) USING TO_CHAR(end_time, '${ISO9075_DATETIME_FORMAT}');
`);
}

export async function down(query: QueryInterface) {
  await query.sequelize.query(`
    ALTER TABLE ${TABLE_NAME}
    ALTER COLUMN start_time TYPE timestamp with time zone USING start_time_legacy,
    ALTER COLUMN end_time TYPE timestamp with time zone USING end_time_legacy;
  `);
  await query.removeColumn(TABLE_NAME, 'start_time_legacy');
  await query.removeColumn(TABLE_NAME, 'end_time_legacy');
}
