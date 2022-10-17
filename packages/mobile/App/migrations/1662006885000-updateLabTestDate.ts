import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const ISO9075_FORMAT = 'YYYY-MM-DD';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

async function testSkipMigration(queryRunner: QueryRunner) : Promise<boolean> {
  // In theory this is never true
  const legacyColumn = await queryRunner.query("PRAGMA table_info('labTest') WHERE name='date_legacy';");
  return legacyColumn.length > 0;
}

// When we're upgrading into a version that uses migrations, we may have run a model sync
// Test if this is the case, and if it was, don't try to rename the column
async function testSyncedBeforeMigration(queryRunner: QueryRunner) : Promise<boolean> {
  const dateColumn = await queryRunner.query("PRAGMA table_info('labTest') WHERE name='date';");
  return dateColumn.length > 0;
}

export class updateLabTestDate1662006885000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    if (await testSkipMigration(queryRunner)) {
      return;
    }

    let columnName = 'sampleTime';
    if (await testSyncedBeforeMigration(queryRunner)) {
      columnName = 'date';
    }

    const tableObject = await getTable(queryRunner, 'labTest');
    // 1. Create legacy columns
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'date_legacy',
        type: 'date',
        isNullable: true,
      }),
    );
    // 2. Copy data to legacy columns for backup
    await queryRunner.query(
      `UPDATE labTest SET date_legacy = ${columnName}`,
    );

    // 3.Change column types from of original columns from date to string & convert data to string
    // NOTE: SQLite doesn't like to update columns, drop the column and recreate it as the new type
    await queryRunner.dropColumn('labTest', columnName);
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'date',
        type: 'varchar',
        length: `${ISO9075_FORMAT_LENGTH}`,
        isNullable: false,
        default: 'date(CURRENT_TIMESTAMP)',
      }),
    );
    // Fill data
    await queryRunner.query(`UPDATE labTest SET date = date(date_legacy) 
    WHERE date_legacy IS NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the string column
    await queryRunner.dropColumn('labTest', 'date');
    // 2. Move legacy data back to main column (with undo rename
    await queryRunner.renameColumn(
      'labTest',
      'date_legacy',
      new TableColumn({
        name: 'date',
        type: 'date',
      }),
    );
  }
}
