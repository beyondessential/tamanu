export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.specimen_resolve_upstream_service_request()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.specimens s
      SET request = to_jsonb(
        ARRAY[
          jsonb_build_object(
            'reference', 'ServiceRequest/' || sr.id,
            'type', 'ServiceRequest'
          )
        ])
      FROM fhir.service_requests sr
      WHERE true
        AND jsonb_extract_path_text(s.request -> 0, 'type') = 'upstream://service_request'
        AND sr.upstream_id::text = jsonb_extract_path_text(s.request -> 0, 'reference')
    $$;
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.specimen_resolve_upstream_practitioner()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.specimens s
      SET collection = collection 
        || jsonb_build_object(
            'collector', 
              jsonb_build_object(
                'reference', 'Practitioner/' || p.id,
                'type', 'Practitioner',
                'display', jsonb_extract_path_text(p.name -> 0, 'text')
              )
        )
      FROM fhir.practitioners p
      WHERE true
        AND jsonb_extract_path_text(s.collection, 'collector', 'type') = 'upstream://practitioner'
        AND p.upstream_id::text = jsonb_extract_path_text(s.collection, 'collector', 'reference')
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
  await query.sequelize.query('DROP PROCEDURE fhir.specimen_resolve_upstream_service_request');
  await query.sequelize.query('DROP PROCEDURE fhir.specimen_resolve_upstream_practitioner');
}
