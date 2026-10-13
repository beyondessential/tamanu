import { QueryInterface } from 'sequelize';

// `setting_get` only returns a value when one has been explicitly stored in the `settings`
// table; `fhir.worker.assumeDroppedAfter` is never stored unless a deployment overrides it
// away from its schema default, so the cast to interval normally yields NULL. That made the
// `updated_at > ...` comparison NULL, `coalesce(..., false)` resolved it to false, and
// job_worker_is_alive reported every worker as dead the moment it registered. Fall back to
// the documented ten-minute window when no override is stored, the same way
// job_worker_garbage_collect already does.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_is_alive(worker_id uuid, OUT alive boolean) RETURNS boolean
      LANGUAGE sql STABLE PARALLEL SAFE
      AS $$
        SELECT coalesce((
          SELECT updated_at > current_timestamp - coalesce(
            (setting_get('fhir.worker.assumeDroppedAfter') ->> 0)::interval,
            interval '10 minutes')
          FROM fhir.job_workers
          WHERE id = worker_id
        ), false)
      $$
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_is_alive(worker_id uuid, OUT alive boolean) RETURNS boolean
      LANGUAGE sql STABLE PARALLEL SAFE
      AS $$
        SELECT coalesce((
          SELECT updated_at > current_timestamp - (setting_get('fhir.worker.assumeDroppedAfter') ->> 0)::interval
          FROM fhir.job_workers
          WHERE id = worker_id
        ), false)
      $$
  `);
}
