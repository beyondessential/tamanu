import { TEST_PATIENT_UUID } from '@tamanu/constants';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const ENCOUNTERS_TABLE = 'encounters';
const PATIENTS_TABLE = 'patients';

export class updateEncountersTableSetPatientIdNotNull1771277667000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const nullCountResult = await queryRunner.query(
      `SELECT COUNT(*) as count FROM ${ENCOUNTERS_TABLE} WHERE patientId IS NULL`,
    );
    const nullCount = parseInt(nullCountResult[0]?.count ?? '0', 10);

    if (nullCount > 0) {
      const testPatientResult = await queryRunner.query(
        `SELECT id FROM ${PATIENTS_TABLE} WHERE id = ? AND deletedAt IS NULL`,
        [TEST_PATIENT_UUID],
      );
      const testPatientExists = testPatientResult.length === 1;

      if (!testPatientExists) {
        throw new Error(
          `Cannot backfill encounters: ${nullCount} encounter(s) have null patientId,
            but the test patient (id = ${TEST_PATIENT_UUID}) does not exist.
            Ensure the test patient exists before running this migration.`,
        );
      }

      await queryRunner.query(
        `UPDATE ${ENCOUNTERS_TABLE} SET patientId = ? WHERE patientId IS NULL`,
        [TEST_PATIENT_UUID],
      );
    }

    const encountersTable = await getTable(queryRunner, ENCOUNTERS_TABLE);
    await queryRunner.changeColumn(
      encountersTable,
      'patientId',
      new TableColumn({
        name: 'patientId',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const encountersTable = await getTable(queryRunner, ENCOUNTERS_TABLE);
    await queryRunner.changeColumn(
      encountersTable,
      'patientId',
      new TableColumn({
        name: 'patientId',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
