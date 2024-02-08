export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.service_requests_resolve_upstream_specimen()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.specimens s
      SET request = to_jsonb(
        ARRAY[
          jsonb_build_object(
            'reference', 'ServceRequest/' || sr.id,
            'type', 'ServiceRequest'
          )
        ])
      FROM fhir.service_requests sr
      WHERE true
        AND jsonb_extract_path_text(s.request, 'type') = 'upstream://service_request'
        AND sr.upstream_id::text = jsonb_extract_path_text(s.request, 'reference')
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
      CALL fhir.service_requests_resolve_upstream_specimen();
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
    $$
`);
  await query.sequelize.query('DROP PROCEDURE fhir.service_requests_resolve_upstream_practitioner');
}
