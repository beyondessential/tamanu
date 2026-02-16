import { TEST_PATIENT_UUID } from '@tamanu/constants';
import { QueryInterface, QueryTypes } from 'sequelize';

// Migration 1 of 2: Backfill data (DML)
// Updates encounters with null patient_id to the test patient (TEST_PATIENT_UUID).
// Throws if any null patient_id exists and the test patient is not found.

export async function up(query: QueryInterface): Promise<void> {
  const nullCountResult: { count: string }[] = await query.sequelize.query(
    `SELECT COUNT(*)::text as count FROM encounters WHERE patient_id IS NULL;`,
    { type: QueryTypes.SELECT },
  );
  const nullCount = parseInt(nullCountResult[0]?.count ?? '0', 10);

  if (nullCount === 0) {
    return;
  }

  const testPatientResult: { id: string }[] = await query.sequelize.query(
    `SELECT id FROM patients WHERE id = :testPatientId AND deleted_at IS NULL LIMIT 1;`,
    {
      type: QueryTypes.SELECT,
      replacements: { testPatientId: TEST_PATIENT_UUID },
    },
  );
  const testPatientExists = testPatientResult.length === 1;

  if (!testPatientExists) {
    throw new Error(
      `Cannot backfill encounters: ${nullCount} encounter(s) have null patient_id,
        but the test patient (id = ${TEST_PATIENT_UUID}) does not exist.
        Ensure the test patient exists before running this migration.`,
    );
  }

  await query.sequelize.query(
    `UPDATE encounters SET patient_id = :testPatientId WHERE patient_id IS NULL;`,
    {
      replacements: { testPatientId: TEST_PATIENT_UUID },
    },
  );
}

export async function down(_query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: Cannot restore original null patient_id values for backfilled rows
}
