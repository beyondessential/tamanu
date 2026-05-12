import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'lab_tests';
const REFERENCE_RANGE_MIN_COLUMN = 'referenceRangeMin';
const REFERENCE_RANGE_MAX_COLUMN = 'referenceRangeMax';

export class addLabTestReferenceRangeColumns1778546880000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);

    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: REFERENCE_RANGE_MIN_COLUMN,
        type: 'decimal',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: REFERENCE_RANGE_MAX_COLUMN,
        type: 'decimal',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);

    // DESTRUCTIVE: This will not restore reference range override values.
    await queryRunner.dropColumn(table, REFERENCE_RANGE_MIN_COLUMN);
    await queryRunner.dropColumn(table, REFERENCE_RANGE_MAX_COLUMN);
  }
}
