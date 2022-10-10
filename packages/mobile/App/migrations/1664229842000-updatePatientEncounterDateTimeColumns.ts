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

export class updatePatientEncounterDateTimeColumns1664229842000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await createDateTimeStringUpMigration(queryRunner, 'diagnosis', 'date');
    await createDateTimeStringUpMigration(queryRunner, 'medication', 'date');
    await createDateTimeStringUpMigration(queryRunner, 'medication', 'endDate');
    await createDateTimeStringUpMigration(queryRunner, 'encounter', 'startDate');
    await createDateTimeStringUpMigration(queryRunner, 'encounter', 'endDate');
    await createDateTimeStringUpMigration(queryRunner, 'vitals', 'dateRecorded');
    await createDateTimeStringUpMigration(queryRunner, 'administered_vaccine', 'date');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await createDateTimeStringDownMigration(queryRunner, 'diagnosis', 'date');
    await createDateTimeStringDownMigration(queryRunner, 'medication', 'date');
    await createDateTimeStringDownMigration(queryRunner, 'medication', 'endDate');
    await createDateTimeStringDownMigration(queryRunner, 'encounter', 'startDate');
    await createDateTimeStringDownMigration(queryRunner, 'encounter', 'endDate');
    await createDateTimeStringDownMigration(queryRunner, 'vitals', 'dateRecorded');
    await createDateTimeStringDownMigration(queryRunner, 'administered_vaccine', 'date');
  }
}
