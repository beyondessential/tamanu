export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir_job_queue_free(
      OUT id UUID,
      OUT resource VARCHAR(255),
      OUT upstream_id VARCHAR(255),
      OUT priority INTEGER
    )
      RETURNS SETOF record
      LANGUAGE SQL
      STABLE
      PARALLEL SAFE
    AS $$
      SELECT id, resource, upstream_id, priority
      FROM fhir_materialise_jobs
      WHERE deleted_at IS NULL
      AND (
        status = 'Queued'
        OR (
          status = 'Started'
          AND started_at <= current_timestamp(3) - (setting_get('fhir.queue.timeout') ->> 0)::interval
        )
      )
      ORDER BY priority DESC, created_at ASC
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir_job_queue_grab(
      OUT id UUID,
      OUT resource VARCHAR(255),
      OUT upstream_id VARCHAR(255),
      OUT priority INTEGER
    )
      RETURNS SETOF record
      LANGUAGE SQL
      VOLATILE
      PARALLEL UNSAFE
    AS $$
      UPDATE fhir_materialise_jobs
      SET status = 'Started', started_at = current_timestamp(3)
      WHERE id IN (
        SELECT id FROM fhir_job_queue_free()
        LIMIT setting_get('fhir.queue.maxConcurrency')::integer
      )
      RETURNING id, resource, upstream_id, priority
    $$
  `);
}

export async function down(query) {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir_job_queue_grab`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir_job_queue_free`);
}
