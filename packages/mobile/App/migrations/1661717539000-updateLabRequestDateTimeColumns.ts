import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  createDateTimeStringUpMigration,
  createDateTimeStringDownMigration,
} from './utils/dateTime';

export class updateLabRequestDateTimeColumns1661717539000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await createDateTimeStringUpMigration(queryRunner, 'labRequest', 'sampleTime');
    await createDateTimeStringUpMigration(queryRunner, 'labRequest', 'requestedDate');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await createDateTimeStringDownMigration(queryRunner, 'labRequest', 'sampleTime');
    await createDateTimeStringDownMigration(queryRunner, 'labRequest', 'requestedDate');
  }
}
