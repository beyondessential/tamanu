import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const tableName = 'settings';
const columnName = 'scope';

export class addScopeToSettingsTable1691115215000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const settingsTable = await getTable(queryRunner, tableName);
    await queryRunner.addColumn(
      settingsTable,
      new TableColumn({
        name: columnName,
        type: 'varchar',
        isNullable: false,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const settingsTable = await getTable(queryRunner, tableName);
    await queryRunner.dropColumn(settingsTable, columnName);
  }
}
