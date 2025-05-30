import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'patient_program_registrations';

export class removeIsMostRecentFromPatientProgramRegistrations1744754327000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, 'isMostRecent');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'isMostRecent',
        type: 'boolean',
        default: 0,
        isNullable: false,
      }),
    );
  }
}
