import { DATE, QueryInterface } from 'sequelize';
import { upMigration, downMigration } from './utils/dateTime';
import { ISO9075_DATE_FORMAT_LENGTH, ISO9075_DATE_FORMAT } from '../constants';

const upMigrationFromTimestamp = upMigration(
  DATE,
  ISO9075_DATE_FORMAT,
  ISO9075_DATE_FORMAT_LENGTH,
);

const downMigrationToTimestamp = downMigration('timestamp with time zone');

export async function up(query: QueryInterface) {
  await upMigrationFromTimestamp(query, 'patients', 'date_of_birth');
  await upMigrationFromTimestamp(query, 'patients', 'date_of_death');
}

export async function down(query: QueryInterface) {
  await downMigrationToTimestamp(query, 'patients', 'date_of_death');
  await downMigrationToTimestamp(query, 'patients', 'date_of_birth');
}
