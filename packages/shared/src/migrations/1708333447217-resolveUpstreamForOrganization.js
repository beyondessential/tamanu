export async function up(query) {

  await query.sequelize.query(`
    ALTER TABLE fhir.encounters
      ADD COLUMN service_provider JSONB;
    CREATE OR REPLACE PROCEDURE fhir.encounters_resolve_upstream_service_provider()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.encounters e
      SET service_provider = jsonb_build_object(
          'reference', 'Organization/' || o.id,
          'type', 'Organization',
          'display', o.name
        )
    FROM fhir.organizations o
    WHERE true
      AND jsonb_extract_path_text(e.service_provider, 'type') = 'upstream://organization'
      AND o.upstream_id::text = jsonb_extract_path_text(e.service_provider, 'reference')
    $$
  `);

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
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE fhir.encounters
      DROP COLUMN service_provider;
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
  await query.sequelize.query('DROP PROCEDURE fhir.encounters_resolve_upstream_service_provider');
}
