import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';
const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

// When we're upgrading into a version that uses migrations, we may have run a model sync
// Test if this is the case, and if it was, skip this migration
async function testSkipMigration(queryRunner: QueryRunner) : Promise<boolean> {
  const legacyColumn = await queryRunner.query("SELECT * FROM pragma_table_info('survey_response') WHERE name='startTime_legacy';");
  return legacyColumn.length > 0;
}

async function createDateTimeStringUpMigration(
  queryRunner: QueryRunner,
  tableName: string,
  columnName: string,
): Promise<void> {
  const tableObject = await getTable(queryRunner, tableName);

  // 1. Create legacy columns
  await queryRunner.addColumn(
    tableObject,
    new TableColumn({
      name: `${columnName}_legacy`,
      type: 'date',
      isNullable: true,
    }),
  );

  // 2. Copy data to legacy columns for backup
  await queryRunner.query(
    `UPDATE ${tableName}
      SET ${columnName}_legacy = ${columnName}`,
  );

  // 3.Change column types from of original columns from date to string & convert data to string
  // NOTE: SQLite doesn't like to update columns, drop the column and recreate it as the new type
  await queryRunner.dropColumn(tableName, columnName);
  await queryRunner.addColumn(
    tableObject,
    new TableColumn({
      name: columnName,
      type: 'string',
      length: `${ISO9075_FORMAT_LENGTH}`,
      isNullable: true,
    }),
  );
  await queryRunner.query(
    `UPDATE ${tableName}
      SET ${columnName} = ${columnName}_legacy`,
  );
}

async function createDateTimeStringDownMigration(
  queryRunner: QueryRunner,
  tableName: string,
  columnName: string,
): Promise<void> {
  // 1. Drop the string column
  await queryRunner.dropColumn(tableName, columnName);

  // 2. Move legacy data back to main column
  await queryRunner.renameColumn(
    tableName,
    `${columnName}_legacy`,
    new TableColumn({
      name: columnName,
      type: 'date',
    }),
  );
}

export class updateSurveyResponseDateTimeColumns1664475769000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await createDateTimeStringUpMigration(queryRunner, 'survey_response', 'startTime');
    await createDateTimeStringUpMigration(queryRunner, 'survey_response', 'endTime');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await createDateTimeStringDownMigration(queryRunner, 'survey_response', 'startTime');
    await createDateTimeStringDownMigration(queryRunner, 'survey_response', 'endTime');
  }
}
