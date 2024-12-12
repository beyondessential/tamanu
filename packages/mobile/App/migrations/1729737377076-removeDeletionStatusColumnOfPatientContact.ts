import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'patient_contact';
const COLUMN_NAME = 'deletionStatus';

export class removeDeletionStatusColumn1712707744000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.dropColumn(table, COLUMN_NAME);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
