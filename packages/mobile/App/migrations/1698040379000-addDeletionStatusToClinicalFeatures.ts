import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const tables = [
  'encounter',
];

export class addDeletionStatusToClinicalFeatures1698040379000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of tables) {
      const tableObject = await getTable(queryRunner, table);
      await queryRunner.addColumn(
        tableObject,
        new TableColumn({
          name: 'deletionStatus',
          type: 'varchar',
          isNullable: true,
          default: null,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of tables) {
      await queryRunner.dropColumn(table, 'deletionStatus');
    }
  }
}
