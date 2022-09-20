import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';
const ISO9075_FORMAT = 'YYYY-MM-DD';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

export class updatePatientIssueDate1663564207000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'patientIssue');
    // Move old data to legacy column
    await queryRunner.query(
      'ALTER TABLE patientIssue RENAME COLUMN recordedDate TO recordedDate_legacy',
    );
    // Add new column
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'recordedDate',
        type: 'string',
        length: `${ISO9075_FORMAT_LENGTH}`,
        isNullable: false,
        default: "strftime('%Y-%m-%d', CURRENT_TIMESTAMP)",
      }),
    );
    // Fill data
    await queryRunner.query('UPDATE patientIssue SET recordedDate = recordedDate_legacy');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the string column
    await queryRunner.query('ALTER TABLE patientIssue DROP COLUMN recordedDate');
    // 2. Move legacy data back to main column (with undo rename
    await queryRunner.query(
      'ALTER TABLE patientIssue RENAME COLUMN recordedDate_legacy TO recordedDate',
    );
  }
}
