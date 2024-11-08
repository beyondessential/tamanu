export const NON_DETERMINISTIC = true;
export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.mark_resources_as_resolved()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.encounters SET resolved = true;
      UPDATE fhir.immunizations SET resolved = true;
      UPDATE fhir.non_fhir_medici_report SET resolved = true;
      UPDATE fhir.organizations SET resolved = true;
      UPDATE fhir.patients SET resolved = true;
      UPDATE fhir.practitioners SET resolved = true;
      UPDATE fhir.service_requests SET resolved = true;
      UPDATE fhir.specimens SET resolved = true;
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.resolve_upstreams()
    LANGUAGE SQL
    AS $$
      CALL fhir.mark_resources_as_resolved();
      
      CALL fhir.encounters_resolve_upstream_service_provider();
      CALL fhir.encounters_resolve_upstream_subject();
      CALL fhir.patients_resolve_upstream_links();
      CALL fhir.service_requests_resolve_upstream_subject();
      CALL fhir.service_requests_resolve_upstream_encounter(); 
      CALL fhir.service_requests_resolve_upstream_practitioner();
      CALL fhir.specimen_resolve_upstream_service_request();
      CALL fhir.specimen_resolve_upstream_practitioner();
      CALL fhir.service_request_resolve_upstream_specimen();
    $$
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.resolve_upstreams()
    LANGUAGE SQL
    AS $$
      CALL fhir.encounters_resolve_upstream_service_provider();
      CALL fhir.encounters_resolve_upstream_subject();
      CALL fhir.patients_resolve_upstream_links();
      CALL fhir.service_requests_resolve_upstream_subject();
      CALL fhir.service_requests_resolve_upstream_encounter(); 
      CALL fhir.service_requests_resolve_upstream_practitioner();
      CALL fhir.specimen_resolve_upstream_service_request();
      CALL fhir.specimen_resolve_upstream_practitioner();
      CALL fhir.service_request_resolve_upstream_specimen();
    $$
`);
  await query.sequelize.query('DROP PROCEDURE fhir.mark_resources_as_resolved');
}
