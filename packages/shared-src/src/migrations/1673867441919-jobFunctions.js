export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION job_submit(
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
      INSERT INTO jobs (topic, discriminant, priority, payload)
      VALUES (to_topic, with_discriminant, at_priority, with_payload)
      ON CONFLICT (discriminant) DO NOTHING
      RETURNING id
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION job_complete(
      IN job_id UUID,
      IN by_worker_id UUID
    )
      RETURNS void
      RETURNS NULL ON NULL INPUT
      LANGUAGE PLPGSQL
      VOLATILE PARALLEL UNSAFE
    AS $$
    BEGIN
      IF job_worker_is_alive(by_worker_id) THEN
        SELECT 1 FROM jobs WHERE id = job_id AND worker_id = by_worker_id;
        IF FOUND THEN
          DELETE FROM jobs WHERE id = job_id;
        ELSE
          RAISE EXCEPTION 'job % is not owned by worker %', job_id, by_worker_id;
        END IF;
      ELSE
        RAISE EXCEPTION 'worker % is not alive', by_worker_id;
      END IF;
    END;
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION job_error(
      IN job_id UUID,
      IN by_worker_id UUID,
      IN error TEXT
    )
      RETURNS void
      RETURNS NULL ON NULL INPUT
      LANGUAGE PLPGSQL
      VOLATILE PARALLEL UNSAFE
    AS $$
    BEGIN
      IF job_worker_is_alive(by_worker_id) THEN
        SELECT 1 FROM jobs WHERE id = job_id AND worker_id = by_worker_id;
        IF FOUND THEN
          UPDATE jobs
          SET
            status = 'Errored',
            updated_at = now(),
            errored_at = now(),
            error = error,
            discriminant = uuid_generate_v4() || '::' || discriminant -- prevent future jobs from matching
          WHERE id = job_id;
        ELSE
          RAISE EXCEPTION 'job % is not owned by worker %', job_id, by_worker_id;
        END IF;
      ELSE
        RAISE EXCEPTION 'worker % is not alive', by_worker_id;
      END IF;
    END;
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION job_grab(
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
      IF job_worker_is_alive(with_worker) THEN
        SELECT id, payload INTO job_id, job_payload
        FROM jobs
        WHERE
          topic = from_topic
          AND (
            status = 'Queued'
            OR (status = 'Started' AND NOT job_worker_is_alive(worker_id))
          )
        ORDER BY priority DESC, created_at ASC
        LIMIT 1;

        IF job_id IS NOT NULL THEN
          UPDATE jobs
          SET
            status = 'Started',
            updated_at = now(),
            started_at = now(),
            worker_id = with_worker
          WHERE id = job_id;
        END IF;
      ELSE
        RAISE EXCEPTION 'worker % is not alive', with_worker;
      END IF;
    END;
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION job_backlog(
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
        FROM jobs
        WHERE topic = for_topic
        AND status = 'Queued' OR (status = 'Started' AND NOT job_worker_is_alive(worker_id));
      ELSE
        SELECT COUNT(*) INTO count
        FROM jobs
        WHERE topic = for_topic
        AND status = 'Queued';
      END IF;
    END;
    $$
  `);

  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS job_grab_idx ON jobs
    USING btree (topic, status, priority DESC, created_at ASC)
  `);
}

export async function down(query) {
  await query.sequelize.query(`DROP INDEX IF EXISTS job_grab_idx`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS job_backlog`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS job_grab`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS job_error`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS job_complete`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS job_submit`);
}
