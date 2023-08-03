import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const tableName = 'user';
const columnName = 'displayId';

export class addDisplayIdToUsers1688428478000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await getTable(queryRunner, tableName);
    await queryRunner.addColumn(
      usersTable,
      new TableColumn({
        name: columnName,
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await getTable(queryRunner, tableName);
    await queryRunner.dropColumn(usersTable, columnName);
  }
}
