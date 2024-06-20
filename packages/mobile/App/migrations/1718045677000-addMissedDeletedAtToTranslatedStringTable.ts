import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

/*
  Even though the translated string table creation was created before the migration
  that adds deletedAt to every table, it wasn't merged to main until much later.
  All versions in the range [1.38, 2.3] include the deletedAt migration, which
  will not run again when upgrading to >=2.4.

  For this reason, we need to conditionally include the deletedAt column for that table.
*/
async function testSkipMigration(queryRunner: QueryRunner): Promise<boolean> {
  const columns = await queryRunner.query("PRAGMA table_info('translated_string');");
  return columns.some(c => c.name === 'deletedAt');
}

export class addMissedDeletedAtToTranslatedStringTable1718045677000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    if (await testSkipMigration(queryRunner)) {
      console.log('Skipping migration because column was already added');
      return;
    }

    const tableObject = await getTable(queryRunner, 'translated_string');
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'deletedAt',
        isNullable: true,
        type: 'date',
        default: null,
      }),
    );
  }

  async down(): Promise<void> {
    // No down migration is needed because this is a corrective step -
    // removing deletedAt will be taken care of in the intended migration
  }
}
