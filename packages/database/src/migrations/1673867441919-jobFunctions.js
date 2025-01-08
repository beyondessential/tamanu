export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_submit(
      IN to_topic TEXT,
      IN with_payload JSONB,
      IN at_priority INTEGER DEFAULT 1000,
      IN with_discriminant TEXT DEFAULT uuid_generate_v4(),
      OUT job_id UUID
    )
      RETURNS NULL ON NULL INPUT
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      INSERT INTO fhir.jobs (topic, discriminant, priority, payload)
      VALUES (to_topic, with_discriminant, at_priority, with_payload)
      ON CONFLICT (discriminant) DO NOTHING
      RETURNING id
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_start(
      IN job_id UUID,
      IN by_worker_id UUID
    )
      RETURNS void
      RETURNS NULL ON NULL INPUT
      LANGUAGE PLPGSQL
      VOLATILE PARALLEL UNSAFE
    AS $$
    DECLARE
      job_worker_id UUID;
    BEGIN
      IF NOT fhir.job_worker_is_alive(by_worker_id) THEN
        RAISE EXCEPTION 'worker % is not alive', by_worker_id;
      END IF;

      SELECT worker_id FROM fhir.jobs WHERE id = job_id INTO job_worker_id;
      IF job_worker_id != by_worker_id THEN
        RAISE EXCEPTION 'job % is not owned by worker %', job_id, by_worker_id;
      END IF;

      UPDATE fhir.jobs
      SET
        status = 'Started',
        updated_at = current_timestamp
      WHERE id = job_id;
    END;
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_complete(
      IN job_id UUID,
      IN by_worker_id UUID
    )
      RETURNS void
      RETURNS NULL ON NULL INPUT
      LANGUAGE PLPGSQL
      VOLATILE PARALLEL UNSAFE
    AS $$
    DECLARE
      job_worker_id UUID;
    BEGIN
      IF NOT fhir.job_worker_is_alive(by_worker_id) THEN
        RAISE EXCEPTION 'worker % is not alive', by_worker_id;
      END IF;

      SELECT worker_id FROM fhir.jobs WHERE id = job_id INTO job_worker_id;
      IF job_worker_id != by_worker_id THEN
        RAISE EXCEPTION 'job % is not owned by worker %', job_id, by_worker_id;
      END IF;

      DELETE FROM fhir.jobs WHERE id = job_id;
    END;
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_fail(
      IN job_id UUID,
      IN by_worker_id UUID,
      IN error_message TEXT
    )
      RETURNS void
      RETURNS NULL ON NULL INPUT
      LANGUAGE PLPGSQL
      VOLATILE PARALLEL UNSAFE
    AS $$
    DECLARE
      job_worker_id UUID;
    BEGIN
      IF NOT fhir.job_worker_is_alive(by_worker_id) THEN
        RAISE EXCEPTION 'worker % is not alive', by_worker_id;
      END IF;

      SELECT worker_id FROM fhir.jobs WHERE id = job_id INTO job_worker_id;
      IF job_worker_id != by_worker_id THEN
        RAISE EXCEPTION 'job % is not owned by worker %', job_id, by_worker_id;
      END IF;

      UPDATE fhir.jobs
      SET
        status = 'Errored',
        updated_at = current_timestamp,
        errored_at = current_timestamp,
        error = error_message,
        discriminant = uuid_generate_v4() || '::' || discriminant -- prevent future jobs from matching
      WHERE id = job_id;
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

  // `job_backlog` has been removed from the application, but we've left the function for on-calls to use for debugging
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_backlog(
      IN for_topic TEXT,
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
        FROM fhir.jobs
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
        );
      ELSE
        SELECT COUNT(*) INTO count
        FROM fhir.jobs
        WHERE topic = for_topic
        AND status = 'Queued';
      END IF;
    END;
    $$
  `);

  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS job_grab_idx ON fhir.jobs
    USING btree (topic, status, priority DESC, created_at ASC)
  `);
}

export async function down(query) {
  await query.sequelize.query(`DROP INDEX IF EXISTS job_grab_idx`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir.job_backlog`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir.job_grab`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir.job_fail`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir.job_complete`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir.job_start`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir.job_submit`);
}
