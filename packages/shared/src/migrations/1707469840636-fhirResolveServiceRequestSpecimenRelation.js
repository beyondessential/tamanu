export const NON_DETERMINISTIC = true;
export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.service_request_resolve_upstream_specimen()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.service_requests sr
      SET specimen = '[]' ||
        jsonb_build_object(
          'reference', 'Specimen/' || s.id,
          'type', 'Specimen'
        )
      FROM fhir.specimens s
      WHERE true
        AND jsonb_extract_path_text(sr.specimen, 'type') = 'upstream://specimen'
        AND s.upstream_id::text = jsonb_extract_path_text(sr.specimen, 'reference')
    $$;
  `);


  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.resolve_upstreams()
    LANGUAGE SQL
    AS $$
      CALL fhir.patients_resolve_upstream_links();
      CALL fhir.service_requests_resolve_upstream_subject();
      CALL fhir.service_requests_resolve_upstream_encounter(); 
      CALL fhir.encounters_resolve_upstream_subject();
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
      CALL fhir.patients_resolve_upstream_links();
      CALL fhir.service_requests_resolve_upstream_subject();
      CALL fhir.service_requests_resolve_upstream_encounter(); 
      CALL fhir.encounters_resolve_upstream_subject();
      CALL fhir.service_requests_resolve_upstream_practitioner();
      CALL fhir.specimen_resolve_upstream_service_request();
      CALL fhir.specimen_resolve_upstream_practitioner();
    $$
`);
  await query.sequelize.query('DROP PROCEDURE fhir.service_request_resolve_upstream_specimen');
}
