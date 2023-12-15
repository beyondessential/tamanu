import { DataTypes } from 'sequelize';

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
          AND status <> 'Errored'
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
}

export async function down(query) {
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
}
