import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'patient_program_registration_condition';
const COLUMN_NAME = 'deletionStatus';

const DELETION_STATUSES = {
  DELETED: 'deleted',
  REVOKED: 'revoked',
  RECORDED_IN_ERROR: 'recorded-in-error',
};

export class removeDeletionStatusColumn1712707744000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE ${TABLE_NAME}
      SET deletedAt = date('now')
      WHERE ${COLUMN_NAME} = '${DELETION_STATUSES.DELETED}'
      AND deletedAt IS NULL;
    `);
    const table = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.dropColumn(table, COLUMN_NAME);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.query(`
      UPDATE ${TABLE_NAME}
      SET ${COLUMN_NAME} = '${DELETION_STATUSES.DELETED}'
      WHERE deletedAt IS NOT NULL;
    `);
    await queryRunner.query(`
      UPDATE ${TABLE_NAME}
      SET deletedAt = NULL
      WHERE deletedAt IS NOT NULL;
    `);
  }
}
