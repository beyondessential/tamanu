export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.service_requests_resolve_upstream_encounter()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.service_requests sr
      SET encounter = jsonb_build_object(
          'reference',
          'Encounter/' || e.id,
          'type',
          'Encounter',
          'identifier',
          null,
          'display',
          null
        )
      FROM fhir.encounters e
      WHERE true
        AND jsonb_extract_path_text(sr.encounter, 'type') = 'upstream://encounter'
        AND e.upstream_id::text = jsonb_extract_path_text(sr.encounter, 'reference')
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
      CALL fhir.encounters_resolve_upstream_subject();
    $$
`);
  await query.sequelize.query('DROP PROCEDURE fhir.service_requests_resolve_upstream_encounter');
}
