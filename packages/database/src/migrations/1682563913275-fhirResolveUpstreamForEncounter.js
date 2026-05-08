export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.encounters_resolve_upstream_subject()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.encounters e
        SET subject = json_build_object(
            'reference', 'Patient/' || p.id,
            'type', 'Patient',
            'identifier', (e.subject ->> 'identifier'),
            'display', (e.subject ->> 'display')
          )
        FROM fhir.patients p
        WHERE true
          AND (e.subject ->> 'type') = 'upstream://patient'
          AND p.upstream_id::text = (e.subject ->> 'reference')
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.resolve_upstreams()
    LANGUAGE SQL
    AS $$
      CALL fhir.patients_resolve_upstream_links();
      CALL fhir.service_requests_resolve_upstream_subject();
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
    $$
  `);
  await query.sequelize.query('DROP PROCEDURE fhir.encounters_resolve_upstream_subject');
}
