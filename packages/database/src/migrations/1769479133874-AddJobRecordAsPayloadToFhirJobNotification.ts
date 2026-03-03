import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS fhir_jobs_insert_trigger ON fhir.jobs;
    CREATE TRIGGER fhir_jobs_insert_trigger after
    INSERT
        ON
        fhir.jobs FOR EACH ROW EXECUTE FUNCTION fhir.jobs_notify();
  `);
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.jobs_notify()
     RETURNS trigger
     LANGUAGE plpgsql
    AS $function$
        BEGIN
          -- avoid ever hitting the queue limit (and failing)
          IF pg_notification_queue_usage() < 0.5 THEN
            PERFORM pg_notify('jobs', row_to_json(NEW)::text);
          END IF;
          RETURN NEW;
        END;
        $function$
    ;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.jobs_notify()
      RETURNS TRIGGER
      LANGUAGE PLPGSQL
    AS $$
    BEGIN
      -- avoid ever hitting the queue limit (and failing)
      IF pg_notification_queue_usage() < 0.5 THEN
        NOTIFY jobs;
      END IF;
      RETURN NEW;
    END;
    $$
  `);

  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS fhir_jobs_insert_trigger ON fhir.jobs;
    CREATE TRIGGER fhir_jobs_insert_trigger
    AFTER INSERT ON fhir.jobs FOR EACH STATEMENT
    EXECUTE FUNCTION fhir.jobs_notify()
  `);
}
