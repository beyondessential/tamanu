import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

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
      // Note that labRequests are already varchar
      type: 'varchar',
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
      type: 'varchar',
      length: `${ISO9075_FORMAT_LENGTH}`,
      isNullable: true,
    }),
  );
  await queryRunner.query(
    `UPDATE ${tableName}
   SET ${columnName} = datetime(${columnName}_legacy, 'localtime') WHERE ${columnName}_legacy IS NOT NULL
   AND ${columnName} = ${columnName}_legacy`,
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
  await queryRunner.renameColumn(tableName, `${columnName}_legacy`, columnName);
}

export class updateLabRequestDateColumns1666171050000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // not a mistake this table name is camelcase unlike others
    await createDateTimeStringUpMigration(queryRunner, 'labRequest', 'sampleTime');
    await createDateTimeStringUpMigration(queryRunner, 'labRequest', 'requestedDate');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await createDateTimeStringDownMigration(queryRunner, 'labRequest', 'sampleTime');
    await createDateTimeStringDownMigration(queryRunner, 'labRequest', 'requestedDate');
  }
}
