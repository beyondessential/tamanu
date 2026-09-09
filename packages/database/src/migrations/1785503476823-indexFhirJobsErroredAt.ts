import { QueryInterface } from 'sequelize';

/**
 * Serves FhirErroredJobCleaner, which deletes errored jobs past a retention
 * window in batches.
 *
 * `job_status_idx` narrows to the errored rows, but they're the bulk of the
 * table once completed jobs have deleted themselves, so every batch fell back
 * to reading what was left of them to find the ones past the window. A partial
 * index on the timestamp answers each batch directly, and only the failure path
 * maintains it.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS job_errored_at_idx ON fhir.jobs
    USING btree (errored_at) WHERE status = 'Errored'
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS fhir.job_errored_at_idx
  `);
}
