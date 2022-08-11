// This file is the typeORM equivalent to the same utility in shared-src/migrations
import { QueryRunner } from 'typeorm';
const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

export async function createDateTimeStringUpMigration(
  queryRunner: QueryRunner,
  tableName: string,
  columnName: string,
): Promise<void> {
  const ver = await queryRunner.query('SELECT sqlite_version()');
  console.log(ver);
  // 1. Move existing data to new legacy column
  await queryRunner.query(
    `ALTER TABLE ${tableName} RENAME COLUMN ${columnName} TO ${columnName}_legacy`,
  );

  // 2. Remake original column name as string type
  await queryRunner.query(
    `ALTER TABLE ${tableName}
       ADD COLUMN ${columnName} TYPE CHAR(${ISO9075_FORMAT_LENGTH})
       USING TO_CHAR(${columnName}_legacy, '${ISO9075_FORMAT}');`,
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
