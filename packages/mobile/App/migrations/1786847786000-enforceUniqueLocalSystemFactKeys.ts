import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'local_system_facts';

/** @see `dedupeLocalSystemFacts1786847785000` companion data migration */
export class enforceUniqueLocalSystemFactKeys1786847786000 implements MigrationInterface {
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
