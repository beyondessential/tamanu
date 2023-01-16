const RESOURCE_TYPE = 'service_requests';
const UPSTREAMS = {
  // self
  imaging_requests: `
    PERFORM fhir_job_queue_submit('${RESOURCE_TYPE}', COALESCE(OLD.id, NEW.id));
  `,
  
  // direct relations
  imaging_request_areas: `
    PERFORM fhir_job_queue_submit('${RESOURCE_TYPE}', COALESCE(OLD.imaging_request_id, NEW.imaging_request_id));
  `,
  encounters: `
    FOR row IN SELECT id FROM imaging_requests WHERE encounter_id = COALESCE(OLD.id, NEW.id) LOOP
      PERFORM fhir_job_queue_submit('${RESOURCE_TYPE}', row.id);
    END LOOP;
  `,
  users: `
    FOR row IN SELECT id FROM imaging_requests WHERE false
      OR requested_by_id = COALESCE(OLD.id, NEW.id)
      OR completed_by_id = COALESCE(OLD.id, NEW.id)
    LOOP
      PERFORM fhir_job_queue_submit('${RESOURCE_TYPE}', row.id);
    END LOOP;
  `,
  locations: `
    FOR row IN SELECT id FROM imaging_requests WHERE location_id = COALESCE(OLD.id, NEW.id) LOOP
      PERFORM fhir_job_queue_submit('${RESOURCE_TYPE}', row.id);
    END LOOP;
  `,
  location_groups: `
    FOR row IN SELECT id FROM imaging_requests WHERE location_group_id = COALESCE(OLD.id, NEW.id) LOOP
      PERFORM fhir_job_queue_submit('${RESOURCE_TYPE}', row.id);
    END LOOP;
  `,
  
  // from encounters
  // 'facilities',
  // 'patients',
  
  // from imaging_request_areas
  // 'reference_data',
  // 'imaging_area_external_codes',
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
