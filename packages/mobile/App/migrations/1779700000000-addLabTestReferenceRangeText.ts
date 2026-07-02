import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'lab_tests';
const COLUMN_NAME = 'referenceRangeText';

export class addLabTestReferenceRangeText1779700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);

    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'text',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);

    // DESTRUCTIVE: This will not restore reference range text override values.
    await queryRunner.dropColumn(table, COLUMN_NAME);
  }
}
