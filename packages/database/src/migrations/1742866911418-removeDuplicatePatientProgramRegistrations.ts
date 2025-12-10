import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Ensure is_most_recent still exists
  const [isMostRecentResults]: any = await query.sequelize.query(`
    SELECT EXISTS (SELECT TRUE
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patient_program_registrations' AND column_name = 'is_most_recent');
  `);

  // Skip migration
  if (!isMostRecentResults?.[0]?.exists) {
    return;
  }

  // Remove duplicate rows
  await query.sequelize.query(`
    -- Get duplicate groups
    WITH duplicate_groups AS (
      SELECT patient_id, program_registry_id
      FROM patient_program_registrations
      WHERE is_most_recent = true
      GROUP BY patient_id, program_registry_id
      HAVING COUNT(*) > 1
    ),
    -- Get all patient program registration rows involved and rank them
    ranked_rows AS (
      SELECT
        ppr.*,
        ROW_NUMBER() OVER (
          PARTITION BY ppr.patient_id, ppr.program_registry_id
          ORDER BY
            -- Priority 1: deleted_at IS NULL (not deleted) gets highest priority
            CASE WHEN deleted_at IS NULL THEN 0 ELSE 1 END ASC,
            -- Priority 2: is_most_recent = true gets second highest priority
            CASE WHEN is_most_recent = true THEN 0 ELSE 1 END ASC,
            -- Priority 3: earliest date
            date ASC
        ) as row_rank
      FROM patient_program_registrations ppr
      INNER JOIN duplicate_groups dg
        ON ppr.patient_id = dg.patient_id
        AND ppr.program_registry_id = dg.program_registry_id
    )

    -- Delete duplicate rows
    DELETE FROM patient_program_registrations
    WHERE id IN (
      SELECT id FROM ranked_rows
      WHERE row_rank > 1
    );
  `);
}

export async function down(): Promise<void> {
  // No down migration
}
