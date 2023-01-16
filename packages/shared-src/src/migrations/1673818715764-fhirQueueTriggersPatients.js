const RESOURCE_TYPE = 'patients';
const UPSTREAMS = ['patients', 'patient_additional_data'];

export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir_queue_trigger_patients() RETURNS TRIGGER LANGUAGE PLPGSQL
    AS $$ BEGIN PERFORM fhir_job_queue_submit('${RESOURCE_TYPE}', COALESCE(OLD.id, NEW.id)); END; $$;

    CREATE OR REPLACE FUNCTION fhir_queue_trigger_patient_additional_data() RETURNS TRIGGER LANGUAGE PLPGSQL
    AS $$ BEGIN PERFORM fhir_job_queue_submit('${RESOURCE_TYPE}', COALESCE(OLD.patient_id, NEW.patient_id)); END; $$;
  `);

  for (const upstream of UPSTREAMS) {
    await query.sequelize.query(`
      CREATE OR REPLACE TRIGGER fhir_job_queue_${upstream}
      AFTER INSERT OR UPDATE ON ${upstream} FOR EACH ROW
      WHEN setting_on('fhir.enabled') AND setting_on('fhir.queue.enabled')
      EXECUTE FUNCTION fhir_queue_trigger_${upstream}();
    `);
  }
}

export async function down(query) {
  for (const upstream of UPSTREAMS) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS fhir_job_queue_${upstream} ON ${upstream}`);
  }

  for (const upstream of UPSTREAMS) {
    await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir_queue_trigger_${upstream}()}`);
  }
}
