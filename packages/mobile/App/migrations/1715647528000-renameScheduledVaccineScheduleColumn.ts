import { MigrationInterface, QueryRunner } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class renameScheduledVaccineScheduleColumn1715647528000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'scheduled_vaccine');

    await queryRunner.renameColumn(tableObject, 'schedule', 'doseLabel');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'scheduled_vaccine');

    await queryRunner.renameColumn(tableObject, 'doseLabel', 'schedule');
  }
}
