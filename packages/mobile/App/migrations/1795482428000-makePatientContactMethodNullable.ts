import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class makePatientContactMethodNullable1795482428000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'patient_contacts');
    await queryRunner.changeColumn(
      tableObject,
      'method',
      new TableColumn({
        name: 'method',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'patient_contacts');
    await queryRunner.changeColumn(
      tableObject,
      'method',
      new TableColumn({
        name: 'method',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }
}
