import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'users';
const COLUMN_NAME = 'kind';

export class addUserKind1783118255000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);

    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'varchar',
        isNullable: false,
        default: "'user'",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);

    // DESTRUCTIVE: sync users will revert to looking like ordinary users.
    await queryRunner.dropColumn(table, COLUMN_NAME);
  }
}
