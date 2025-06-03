import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addPatientProgramRegistrationConditionCategoryColumn1739395962000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, 'patient_program_registration_conditions');
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'conditionCategory',
        type: 'string',
        isNullable: false,
        default: "'unknown'",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, 'patient_program_registration_conditions');
    await queryRunner.dropColumn(table, 'conditionCategory');
  }
}
