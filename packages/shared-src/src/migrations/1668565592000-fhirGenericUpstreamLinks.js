export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.service_requests_resolve_upstream_subject()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.service_requests sr
        SET subject = ROW(
            'Patient/' || p.id,
            'Patient',
            (sr.subject).identifier,
            (sr.subject).display
          )::fhir.reference
        FROM fhir.patients p
        WHERE true
          AND (sr.subject).type = 'upstream://patient'
          AND p.id = (sr.subject).reference
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.resolve_upstreams()
    LANGUAGE SQL
    AS $$
      CALL fhir.patient_resolve_upstream_links();
      CALL fhir.service_requests_resolve_upstream_subject();
    $$
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP PROCEDURE fhir.resolve_upstream_links');
  await query.sequelize.query('DROP PROCEDURE fhir.service_requests_resolve_upstream_subject');
}
