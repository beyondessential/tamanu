import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';
const ISO9075_FORMAT = 'YYYY-MM-DD';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

export class updateLabTestDate1662006885000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'labTest');
    // Move old data to legacy column
    await queryRunner.query('ALTER TABLE labTest RENAME COLUMN sampleTime TO sampleTime_legacy');
    // Add new column (with rename sampleTime -> date)
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'date',
        type: 'string',
        length: `${ISO9075_FORMAT_LENGTH}`,
        isNullable: false,
        default: "strftime('%Y-%m-%d', CURRENT_TIMESTAMP)",
      }),
    );
    // Fill data
    queryRunner.query(
      'UPDATE labTest SET date = sampleTime_legacy',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the string column
    await queryRunner.query('ALTER TABLE labTest DROP COLUMN date');
    // 2. Move legacy data back to main column (with undo rename
    await queryRunner.query('ALTER TABLE labTest RENAME COLUMN sampleTime_legacy TO sampleTime');
  }
}
