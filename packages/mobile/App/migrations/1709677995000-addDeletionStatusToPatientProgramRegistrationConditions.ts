import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'patient_program_registration_condition';
const COLUMN_NAME = 'deletionStatus';

export class addDeletionStatusToPatientProgramRegistrationConditions1709677995000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.addColumn(
      usersTable,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.dropColumn(usersTable, COLUMN_NAME);
  }
}
