export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_backlog_until_limit(
      IN for_topic TEXT,
      IN the_limit BIGINT,
      IN include_dropped BOOLEAN,
      OUT count BIGINT
    )
      RETURNS NULL ON NULL INPUT
      LANGUAGE PLPGSQL
      STABLE PARALLEL SAFE
    AS $$
    BEGIN
      IF include_dropped THEN
        SELECT COUNT(*) INTO count
        FROM (
          SELECT 1 FROM fhir.jobs
          WHERE topic = for_topic
          AND (
            status = 'Queued'
            OR (
              status = 'Grabbed'
              AND updated_at < current_timestamp - interval '10 seconds'
            )
            OR (
              status = 'Started'
              AND NOT fhir.job_worker_is_alive(worker_id)
            )
          )
          LIMIT the_limit
        ) AS limited_jobs;
      ELSE
        SELECT COUNT(*) INTO count
        FROM (
          SELECT 1 FROM fhir.jobs
          WHERE topic = for_topic
          AND status = 'Queued'
          LIMIT the_limit
        ) AS limited_jobs;
      END IF;
    END;
    $$
    
  `);
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_grab(
      IN with_worker UUID,
      IN from_topic TEXT,
      OUT job_id UUID,
      OUT job_payload JSONB
    )
      RETURNS NULL ON NULL INPUT
      LANGUAGE PLPGSQL
      VOLATILE PARALLEL UNSAFE
    AS $$
    BEGIN
      IF NOT fhir.job_worker_is_alive(with_worker) THEN
        RAISE EXCEPTION 'worker % is not alive', with_worker;
      END IF;

      SELECT id, payload INTO job_id, job_payload
      FROM fhir.jobs
      WHERE
        topic = from_topic
        AND (
          status = 'Queued'
          OR (
            status = 'Grabbed'
            AND updated_at < current_timestamp - interval '10 seconds'
          )
          OR (
            status = 'Started'
            AND NOT fhir.job_worker_is_alive(worker_id)
          )
        )
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
      FOR UPDATE
      SKIP LOCKED;

      IF job_id IS NOT NULL THEN
        UPDATE fhir.jobs
        SET
          status = 'Grabbed',
          updated_at = current_timestamp,
          started_at = current_timestamp,
          worker_id = with_worker
        WHERE id = job_id;
      END IF;
    END;
    $$
  `);
  await query.sequelize.query(`DROP INDEX fhir."job_grab_idx"`);
  await query.sequelize.query(`
    CREATE INDEX job_grab_sort_idx ON fhir.jobs
    USING btree (priority DESC, created_at ASC)
  `);
  await query.sequelize.query(`CREATE INDEX job_status_idx ON fhir.jobs USING btree (status)`);
  await query.sequelize.query(`CREATE INDEX job_topic_idx ON fhir.jobs USING btree (topic)`);
}

export async function down(query) {
  await query.sequelize.query(`DROP INDEX fhir."job_topic_idx"`);
  await query.sequelize.query(`DROP INDEX fhir."job_status_idx"`);
  await query.sequelize.query(`DROP INDEX fhir."job_grab_sort_idx"`);
  await query.sequelize.query(`
    CREATE INDEX job_grab_idx ON fhir.jobs
    USING btree (topic, status, priority DESC, created_at ASC)
  `);
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_grab(
      IN with_worker UUID,
      IN from_topic TEXT,
      OUT job_id UUID,
      OUT job_payload JSONB
    )
      RETURNS NULL ON NULL INPUT
      LANGUAGE PLPGSQL
      VOLATILE PARALLEL UNSAFE
    AS $$
    BEGIN
      IF NOT fhir.job_worker_is_alive(with_worker) THEN
        RAISE EXCEPTION 'worker % is not alive', with_worker;
      END IF;

      SELECT id, payload INTO job_id, job_payload
      FROM fhir.jobs
      WHERE
        topic = from_topic
        AND (
          status = 'Queued'
          OR (
            status = 'Grabbed'
            AND updated_at < current_timestamp - interval '10 seconds'
          )
          OR (
            status = 'Started'
            AND NOT fhir.job_worker_is_alive(worker_id)
          )
        )
      ORDER BY priority DESC, created_at ASC
      LIMIT 1;

      IF job_id IS NOT NULL THEN
        UPDATE fhir.jobs
        SET
          status = 'Grabbed',
          updated_at = current_timestamp,
          started_at = current_timestamp,
          worker_id = with_worker
        WHERE id = job_id;
      END IF;
    END;
    $$
  `);
  await query.sequelize.query(`DROP FUNCTION fhir.job_backlog_until_limit`);
}
