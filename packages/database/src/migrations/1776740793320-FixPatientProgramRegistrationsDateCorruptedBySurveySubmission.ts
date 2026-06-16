import { type QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // A bug caused patient_program_registrations.date to be overwritten whenever a survey was
  // submitted. Recover the correct registration date from logs.changes by finding the `date`
  // value at the most recent point where `registration_status` transitioned to 'active'.
  await query.sequelize.query(`
    WITH changelog_with_prev AS (
      SELECT
        record_id,
        logged_at,
        record_data,
        LAG(record_data->>'registration_status') OVER (
          PARTITION BY record_id
          ORDER BY logged_at ASC
        ) AS prev_registration_status
      FROM logs.changes
      WHERE table_name = 'patient_program_registrations'
    ),
    activation_events AS (
      -- Rows where registration_status transitioned TO 'active': either the first
      -- log entry for the record (prev is NULL, i.e. an insert), or the previous
      -- state was not 'active' (a re-activation after inactive/recordedInError).
      SELECT
        record_id,
        logged_at,
        record_data->>'date' AS correct_date
      FROM changelog_with_prev
      WHERE
        record_data->>'registration_status' = 'active'
        AND (prev_registration_status IS NULL OR prev_registration_status != 'active')
    ),
    correct_dates AS (
      -- Most recent activation event per registration
      SELECT DISTINCT ON (record_id)
        record_id,
        correct_date
      FROM activation_events
      ORDER BY record_id, logged_at DESC
    )
    UPDATE patient_program_registrations AS ppr
    SET date = correct_dates.correct_date
    FROM correct_dates
    WHERE
      ppr.id = correct_dates.record_id
      -- Only update rows that actually need fixing, keeping the migration idempotent.
      AND ppr.date IS DISTINCT FROM correct_dates.correct_date;
  `);
}

export async function down(): Promise<void> {
  // No reverse migration — original corrupted dates are not preserved.
}
