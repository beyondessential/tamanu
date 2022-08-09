import { QueryInterface, DATE } from 'sequelize';
import {
  createDateTimeStringUpMigration,
  createDateTimeStringDownMigration,
} from './utils/dateTime';
import { ISO9075_DATETIME_FORMAT, ISO9075_DATETIME_FORMAT_LENGTH } from '../constants';

export async function up(query: QueryInterface) {
  // // 1. Create legacy columns
  // await query.addColumn('triage', `arrivalTime_legacy`, {
  //   type: DATE,
  // });
  //
  // // 2. Copy data to legacy columns for backup
  // await query.sequelize.query(`UPDATE triage SET arrivalTime_legacy = arrivalTime;`);
  //
  // // 3.Change column types from of original columns from date to string & convert data to string
  // await query.sequelize.query(
  //   `ALTER TABLE triage
  //       ALTER COLUMN arrivalTime TYPE CHAR(${ISO9075_DATETIME_FORMAT_LENGTH})
  //       USING TO_CHAR(arrivalTime, '${ISO9075_DATETIME_FORMAT}');`,
  // );

  await createDateTimeStringUpMigration(query, 'triages', 'arrival_time');
  await createDateTimeStringUpMigration(query, 'triages', 'triage_time');
  await createDateTimeStringUpMigration(query, 'triages', 'closed_time');
}

export async function down(query: QueryInterface) {
  await createDateTimeStringDownMigration(query, 'triages', 'arrival_time');
  await createDateTimeStringDownMigration(query, 'triages', 'triage_time');
  await createDateTimeStringDownMigration(query, 'triages', 'closed_time');
}
