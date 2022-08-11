import { QueryInterface } from 'sequelize';
import {
  createDateTimeStringUpMigration,
  createDateTimeStringDownMigration,
} from './utils/dateTime';

export async function up(query: QueryInterface) {
  await createDateTimeStringUpMigration(query, 'lab_requests', 'sample_time');
  await createDateTimeStringUpMigration(query, 'lab_requests', 'requested_date');
}

export async function down(query: QueryInterface) {
  await createDateTimeStringDownMigration(query, 'lab_requests', 'sample_time');
  await createDateTimeStringDownMigration(query, 'lab_requests', 'requested_date');
}
