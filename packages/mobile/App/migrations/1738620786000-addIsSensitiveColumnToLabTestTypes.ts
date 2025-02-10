import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addIsSensitiveColumnToLabTestTypes1738620786000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const labTestTypeTable = await getTable(queryRunner, 'lab_test_types');
    await queryRunner.addColumn(
      labTestTypeTable,
      new TableColumn({
        name: 'isSensitive',
        type: 'boolean',
        isNullable: false,
        default: 0,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const labTestTypeTable = await getTable(queryRunner, 'lab_test_types');
    await queryRunner.dropColumn(labTestTypeTable, 'isSensitive');
  }
}
