import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Adds a partial unique index to prevent multiple open encounters per patient.
 * This ensures that only one encounter with end_date IS NULL and deleted_at IS NULL
 * can exist per patient at the database level, preventing race conditions.
 *
 * The constraint is enforced at the database level, so it works regardless of
 * how the data is accessed (direct SQL, application code, etc.).
 */
export async function up(query: QueryInterface): Promise<void> {
  // Check for duplicate open encounters before adding the constraint
  const duplicates = (await query.sequelize.query(
    `
    SELECT patient_id, COUNT(*) as count
    FROM encounters
    WHERE end_date IS NULL
      AND deleted_at IS NULL
      AND patient_id IS NOT NULL
    GROUP BY patient_id
    HAVING COUNT(*) > 1
    `,
    { type: QueryTypes.SELECT },
  )) as Array<{ patient_id: string; count: number }>;

  if (duplicates.length > 0) {
    const patientIds = duplicates
      .map(d => `patient_id: ${d.patient_id} (${d.count} open encounters)`)
      .join(', ');
    throw new Error(
      `Found patients with multiple open encounters. Please resolve these duplicates before proceeding: ${patientIds}`,
    );
  }

  // Create partial unique index to enforce one open encounter per patient
  // This is a "partial" index because it only applies to rows matching the WHERE clause
  await query.sequelize.query(`
    CREATE UNIQUE INDEX encounters_one_open_per_patient_idx
    ON encounters (patient_id)
    WHERE end_date IS NULL AND deleted_at IS NULL AND patient_id IS NOT NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS encounters_one_open_per_patient_idx
  `);
}
