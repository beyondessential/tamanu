// This file is the typeORM equivalent to the same utility in shared-src/migrations
//
// THESE FUNCTIONS ARE TEMPLATES, COPY PASTE THEM TO YOUR MIGRATION
// DON'T EXPORT
// IF THE TEMPLATE CHANGES OLD MIGRATIONS SHOULD NOT CHANGE WITH IT
import { QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './queryRunner';
const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

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
  await queryRunner.query(`ALTER TABLE ${tableName} RENAME COLUMN ${columnName}_legacy TO ${columnName}`);
}
