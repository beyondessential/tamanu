import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_deregister(
      IN worker_id UUID
    )
      RETURNS void
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      UPDATE fhir.job_workers
      SET deleted_at = current_timestamp
      WHERE id = worker_id
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

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_deregister(
      IN worker_id UUID
    )
      RETURNS void
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      DELETE FROM fhir.job_workers WHERE id = worker_id
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_garbage_collect()
      RETURNS void
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      DELETE FROM fhir.job_workers
      WHERE updated_at < current_timestamp - (setting_get('fhir.worker.assumeDroppedAfter') ->> 0)::interval
    $$
  `);
}
