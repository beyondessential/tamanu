import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS fhir."job_grab_idx";

    -- Add index on fhir.jobs table which is optimised for the fhir.job_grab function
    CREATE INDEX job_grab_idx ON fhir.jobs USING BTREE (topic, status, priority DESC, created_at);
  `);

  await query.sequelize.query(`
    -- Rework the fhir.job_grab function to perform 3 separate selects which allows for better use of the new index
    CREATE OR REPLACE FUNCTION fhir.job_grab(with_worker uuid, from_topic text, OUT job_id uuid, OUT job_payload jsonb)
      RETURNS record
      LANGUAGE plpgsql
      STRICT
    AS $function$
    BEGIN
      IF NOT fhir.job_worker_is_alive(with_worker) THEN
        RAISE EXCEPTION 'worker % is not alive', with_worker;
      END IF;
    
      -- The next queued job
      WITH queued_job AS (
        SELECT id, payload, priority, created_at FROM fhir.jobs
        WHERE (
          topic = from_topic
          AND status = 'Queued'
        )
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE
        SKIP LOCKED
      ),
      
      -- A currently grabbed job that hasn't been updated in 10 seconds (it may have gone stale)
      grabbed_job AS (
        SELECT id, payload, priority, created_at FROM fhir.jobs
        WHERE (
          topic = from_topic
          AND status = 'Grabbed'
          AND updated_at < CURRENT_TIMESTAMP - INTERVAL '10 seconds'
        )
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE
        SKIP LOCKED
      ),
      
      -- A started job whose worker has died
      started_job AS (
        SELECT id, payload, priority, created_at FROM fhir.jobs
        WHERE (
          topic = from_topic
          AND status = 'Started'
          AND NOT fhir.job_worker_is_alive(worker_id)
        )
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE
        SKIP LOCKED
      )
     
      -- Of these 3 candidate jobs, grab the highest priority / oldest
      SELECT id, payload INTO job_id, job_payload
      FROM (
        SELECT * FROM queued_job
        UNION 
        SELECT * FROM grabbed_job
        UNION 
        SELECT * FROM started_job
      ) AS candidate_jobs
      ORDER BY priority DESC, created_at ASC
      LIMIT 1;
    
      IF job_id IS NOT NULL THEN
        UPDATE fhir.jobs
        SET
          status = 'Grabbed',
          updated_at = CURRENT_TIMESTAMP,
          started_at = CURRENT_TIMESTAMP,
          worker_id = with_worker
        WHERE id = job_id;
      END IF;
    END;
    $function$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
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
  await query.sequelize.query(`DROP INDEX IF EXISTS fhir."job_grab_idx";`);
}
