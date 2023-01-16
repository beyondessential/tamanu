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
        PERFORM UPDATE jobs
        SET
          status = 'Started',
          updated_at = current_timestamp(3),
          started_at = current_timestamp(3),
          worker_id = with_worker
        WHERE id = job_id;
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
        AND status = 'Queued' OR (status = 'Started' AND NOT job_worker_is_alive(worker_id)));
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
  await query.sequelize.query(`DROP FUNCTION IF EXISTS job_submit`);
}
