import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addPatientProgramRegistrationReasonForChange1740342611000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, 'patient_program_registration_conditions');
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'reasonForChange',
        type: 'string',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, 'patient_program_registration_conditions');
    await queryRunner.dropColumn(table, 'reasonForChange');
  }
}
