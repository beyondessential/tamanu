import { QueryInterface } from 'sequelize';

// `setting_get` only returns a value when one has been explicitly stored in the `settings`
// table; `fhir.worker.assumeDroppedAfter` is never stored unless someone overrides it away
// from its schema default (see packages/settings/src/schema/global.ts), so setting_get()
// normally returns NULL here. Casting NULL to an interval makes the `updated_at > ...`
// comparison NULL too, and `coalesce(NULL, false)` resolves to false — so job_worker_is_alive
// always reported workers as dead, and job_worker_garbage_collect always reaped them, even
// moments after registration. Falling back to the schema default of '10 minutes' when no
// override is stored fixes both.
const FALLBACK_ASSUME_DROPPED_AFTER = `'"10 minutes"'::jsonb`;

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_is_alive(worker_id uuid, OUT alive boolean) RETURNS boolean
      LANGUAGE sql STABLE PARALLEL SAFE
      AS $$
        SELECT coalesce((
          SELECT updated_at > current_timestamp - (coalesce(setting_get('fhir.worker.assumeDroppedAfter'), ${FALLBACK_ASSUME_DROPPED_AFTER}) ->> 0)::interval
          FROM fhir.job_workers
          WHERE id = worker_id
        ), false)
      $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_garbage_collect()
      RETURNS void
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      UPDATE fhir.job_workers
      SET deleted_at = current_timestamp
      WHERE updated_at < current_timestamp - (coalesce(setting_get('fhir.worker.assumeDroppedAfter'), ${FALLBACK_ASSUME_DROPPED_AFTER}) ->> 0)::interval
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

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_garbage_collect()
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
