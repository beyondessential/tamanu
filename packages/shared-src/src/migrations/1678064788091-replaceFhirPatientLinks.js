export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.patients_resolve_upstream_links()
    LANGUAGE SQL
    AS $$
      WITH
        links AS (
          SELECT id, jsonb_array_elements(link) link
            FROM fhir.patients
            WHERE 'upstream://patient' = ANY(SELECT jsonb_path_query(link, '$[*].other.type') #>> '{}')
        ),
        downstreamed AS (
          SELECT links.id, jsonb_extract_path(links.link, 'type') AS type, jsonb_extract_path(links.link, 'other') AS other, fhir.patients.id link_id
            FROM fhir.patients
            JOIN links ON fhir.patients.upstream_id = jsonb_extract_path_text(links.link, 'other', 'reference')
        ),
        new_links AS (
          SELECT id, to_jsonb(
            array_agg(
              jsonb_build_object(
                'other',
                jsonb_build_object(
                  'reference',
                  'Patient/' || link_id,
                  'type',
                  'Patient',
                  'identifier',
                  jsonb_extract_path(other, 'identifier'),
                  'display',
                  jsonb_extract_path(other, 'display')
                ),
                'type',
                type
              )
            )
          ) new_link
            FROM downstreamed
            GROUP by id
        )
      UPDATE fhir.patients p
        SET link = n.new_link
        FROM new_links n
        WHERE p.id = n.id;
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.service_requests_resolve_upstream_subject()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.service_requests sr
        SET subject = jsonb_build_object(
            'reference',
            'Patient/' || p.id,
            'type',
            'Patient',
            'identifier',
            jsonb_extract_path_text(sr.subject, 'identifier'),
            'display',
            jsonb_extract_path_text(sr.subject, 'display')
          )
        FROM fhir.patients p
        WHERE true
          AND jsonb_extract_path_text(sr.subject, 'type') = 'upstream://patient'
          AND p.upstream_id::text = jsonb_extract_path_text(sr.subject, 'reference')
    $$
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.patients_resolve_upstream_links()
    LANGUAGE SQL
    AS $$
      WITH
        links AS (
          SELECT id, UNNEST(link) link
            FROM fhir.patients
            WHERE 'upstream://patient' = ANY(SELECT type(other(UNNEST(link))))
        ),
        downstreamed AS (
          SELECT links.id, type(links.link), other(links.link), fhir.patients.id link_id
            FROM fhir.patients
            JOIN links ON fhir.patients.upstream_id = reference(other(links.link))
        ),
        new_links AS (
          SELECT id, array_agg(
            ROW(
              ROW(
                'Patient/' || link_id,
                'Patient',
                identifier(other),
                display(other)
              )::fhir.reference,
              type
            )::fhir.patient_link
          ) new_link
            FROM downstreamed
            GROUP by id
        )
      SELECT new_links.new_link FROM new_links;
      UPDATE fhir.patients p
        SET link = n.new_link
        FROM new_links n
        WHERE p.id = n.id;
    $$
  `);

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
          AND p.upstream_id::text = (sr.subject).reference
    $$
  `);
}
