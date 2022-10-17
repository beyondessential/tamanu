import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const ISO9075_FORMAT = 'YYYY-MM-DD';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

export class updateLabTestDate1662006885000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query('UPDATE labTest SET date_legacy = date');

    // 3.Change column types from of original columns from date to string & convert data to string
    // NOTE: SQLite doesn't like to update columns, drop the column and recreate it as the new type
    await queryRunner.dropColumn('labTest', 'date');
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
    await queryRunner.query(`UPDATE labTest SET date = date(date_legacy, 'localtime') 
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
