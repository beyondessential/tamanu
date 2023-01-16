const RESOURCE_TYPE = 'patients';
const UPSTREAMS = {
  patients: `
    PERFORM fhir_job_queue_submit('${RESOURCE_TYPE}', COALESCE(OLD.id, NEW.id));
  `,
  patient_additional_data: `
    PERFORM fhir_job_queue_submit('${RESOURCE_TYPE}', COALESCE(OLD.patient_id, NEW.patient_id));
  `,
};

export async function up(query) {
  for (const [upstream, body] of Object.entries(UPSTREAMS)) {
    await query.sequelize.query(`
      CREATE OR REPLACE FUNCTION fhir_queue_trigger__${RESOURCE_TYPE}__${upstream}() RETURNS TRIGGER LANGUAGE PLPGSQL
      AS $$ BEGIN IF setting_on('fhir.enabled') AND setting_on('fhir.queue.enabled') THEN ${body} END IF; END; $$;
    
      CREATE OR REPLACE TRIGGER fhir_queue__${RESOURCE_TYPE}
      AFTER INSERT OR UPDATE ON ${upstream} FOR EACH ROW
      EXECUTE FUNCTION fhir_queue_trigger__${RESOURCE_TYPE}__${upstream}();
    `);
  }
}

export async function down(query) {
  for (const upstream of Object.keys(UPSTREAMS)) {
    await query.sequelize.query(`
      DROP TRIGGER IF EXISTS fhir_queue__${RESOURCE_TYPE} ON ${upstream};
      DROP FUNCTION IF EXISTS fhir_queue_trigger__${RESOURCE_TYPE}__${upstream}();
    `);
  }
}
