import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'local_system_facts';

/** @see `dedupeLocalSystemFacts1787706000000` companion data migration */
export class enforceUniqueLocalSystemFactKeys1787706001000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.changeColumn(
      table,
      'key',
      new TableColumn({
        name: 'key',
        type: 'varchar',
        isNullable: false,
        isUnique: true,
      }),
    );
  }

  /**
   * SQLite has no `ALTER TABLE … DROP CONSTRAINT`, so TypeORM drops a unique constraint by
   * rebuilding the whole table — and it rebuilds from `table.uniques`, which is why the constraint
   * has to be looked up and handed over from there. Mirroring `up()` with
   * `changeColumn({ isUnique: false })` apparently silently does nothing, so taking agents’ (yes,
   * plural) word for it that this is the way to go.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);
    const uniqueConstraint = table.uniques.find(
      unique => unique.columnNames.length === 1 && unique.columnNames[0] === 'key',
    );
    if (uniqueConstraint) {
      await queryRunner.dropUniqueConstraint(table, uniqueConstraint);
    }
  }
}
