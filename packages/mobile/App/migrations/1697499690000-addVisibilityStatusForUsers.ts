import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addVisibilityStatusForUsers1697499690000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'user');

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'visibilityStatus',
        isNullable: false,
        type: 'varchar',
        default: "'current'",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'user');
    await queryRunner.dropColumn(tableObject, 'visibilityStatus');
  }
}
