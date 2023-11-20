export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.service_requests_resolve_upstream_practitioner()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.service_requests sr
      SET requester = jsonb_build_object(
          'reference', 'Practitioner/' || p.id,
          'type', 'Practitioner',
          'identifier', null,
          'display', p.name->0->>'text'
        )
      FROM fhir.practitioners p
      WHERE true
        AND jsonb_extract_path_text(sr.requester, 'type') = 'upstream://practitioner'
        AND p.upstream_id::text = jsonb_extract_path_text(sr.requester, 'reference')
    $$
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
    $$
`);
  await query.sequelize.query('DROP PROCEDURE fhir.service_requests_resolve_upstream_practitioner');
}
