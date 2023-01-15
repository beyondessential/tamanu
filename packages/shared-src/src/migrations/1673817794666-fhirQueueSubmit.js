export async function up(query) {
  query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir_job_queue_submit(
      resource_type VARCHAR(255),
      upstream_id VARCHAR(255),
      priority INTEGER DEFAULT 0
    )
      RETURNS UUID
      RETURNS NULL ON NULL INPUT
      LANGUAGE SQL
      VOLATILE
      PARALLEL UNSAFE
    AS $$
      INSERT INTO fhir_materialise_jobs (upstream_id, resource, priority)
      VALUES (upstream_id, resource_type, priority)
      ON CONFLICT (upstream_id, resource) DO UPDATE SET priority = EXCLUDED.priority
      RETURNING id
    $$
  `);
}

export async function down(query) {
  query.sequelize.query(`DROP FUNCTION IF EXISTS fhir_job_queue_submit`);
}
