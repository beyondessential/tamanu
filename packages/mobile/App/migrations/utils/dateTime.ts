// This file is the typeORM equivalent to the same utility in shared-src/migrations
import { QueryRunner, TableColumn } from 'typeorm';
const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

export async function createDateTimeStringUpMigration(
  queryRunner: QueryRunner,
  tableName: string,
  columnName: string,
): Promise<void> {
  // 1. Create legacy columns
  await queryRunner.addColumn(
    tableName,
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
    tableName,
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

export async function createDateTimeStringDownMigration(
  queryRunner: QueryRunner,
  tableName: string,
  columnName: string,
): Promise<void> {
  // 1. Drop the string column
  await queryRunner.query(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);

  // 2. Move legacy data back to main column
  await queryRunner.query(`ALTER TABLE ${tableName} RENAME COLUMN ${columnName}_legacy TO ${columnName}`);
}
