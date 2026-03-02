import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const tableName = 'lab_test_types';
const columnName = 'supportsSecondaryResults';

export class addSupportsSecondaryResultsToLabTestType1768527821000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: columnName,
        type: 'boolean',
        isNullable: false,
        default: 'false',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);
    await queryRunner.dropColumn(tableObject, columnName);
  }
}
