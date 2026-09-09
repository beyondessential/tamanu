import { QueryInterface } from 'sequelize';

// Garbage collection matched every stale row, including the ones already
// soft-deleted, so each run rewrote the whole history of the registry rather
// than only what it had to prune. Now that a scheduled task runs it daily, skip
// the rows that are already gone, and fall back to the documented ten-minute
// window when the deployment has no assumeDroppedAfter setting of its own —
// without a fallback the whole statement matches nothing at all. It now reports
// how many workers it pruned, so a caller can say so.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir.job_worker_garbage_collect()`);
  await query.sequelize.query(`
    CREATE FUNCTION fhir.job_worker_garbage_collect()
      RETURNS bigint
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      WITH pruned AS (
        UPDATE fhir.job_workers
        SET deleted_at = current_timestamp
        WHERE deleted_at IS NULL
        AND updated_at < current_timestamp - (
          SELECT coalesce(
            (setting_get('fhir.worker.assumeDroppedAfter') ->> 0)::interval,
            interval '10 minutes')
        )
        RETURNING 1
      )
      SELECT count(*) FROM pruned
    $$
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir.job_worker_garbage_collect()`);
  await query.sequelize.query(`
    CREATE FUNCTION fhir.job_worker_garbage_collect()
      RETURNS void
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      UPDATE fhir.job_workers
      SET deleted_at = current_timestamp
      WHERE updated_at < current_timestamp - (setting_get('fhir.worker.assumeDroppedAfter') ->> 0)::interval
    $$
  `);
}
