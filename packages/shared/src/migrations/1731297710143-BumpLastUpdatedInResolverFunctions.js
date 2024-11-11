export const NON_DETERMINISTIC = true;
export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.encounters_resolve_upstream_service_provider()
    LANGUAGE SQL
    AS $$
      -- Resolve the service provider of an encounter to an organization
      UPDATE fhir.encounters e
      SET 
        service_provider = jsonb_build_object(
          'reference', 'Organization/' || o.id,
          'type', 'Organization',
          'display', o.name
        ),
        last_updated = now()
      FROM fhir.organizations o
      WHERE true
        AND jsonb_extract_path_text(e.service_provider, 'type') = 'upstream://organization'
        AND o.upstream_id::text = jsonb_extract_path_text(e.service_provider, 'reference');

      -- Mark remaining unresolved encounters as unresolved
      UPDATE fhir.encounters e
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(e.service_provider, 'type') = 'upstream://organization';
    $$;

    CREATE OR REPLACE PROCEDURE fhir.encounters_resolve_upstream_subject()
    LANGUAGE SQL
    AS $$
      -- Resolve the subject of an encounter to a patient
      UPDATE fhir.encounters e
      SET 
        subject = json_build_object(
          'reference', 'Patient/' || p.id,
          'type', 'Patient',
          'identifier', (e.subject ->> 'identifier'),
          'display', (e.subject ->> 'display')
        ),
        last_updated = now()
      FROM fhir.patients p
      WHERE true
        AND (e.subject ->> 'type') = 'upstream://patient'
        AND p.upstream_id::text = (e.subject ->> 'reference');

      -- Mark remaining unresolved encounters as unresolved
      UPDATE fhir.encounters e
      SET 
        resolved = false
      WHERE (e.subject ->> 'type') = 'upstream://patient';
    $$;

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

      -- Resolve the links of patient
      UPDATE fhir.patients p
        SET 
          link = n.new_link,
          last_updated = now()
        FROM new_links n
        WHERE p.id = n.id;

      -- Mark remaining unresolved patients as unresolved
      UPDATE fhir.patients p
        SET 
          resolved = false
        WHERE 'upstream://patient' = ANY(SELECT jsonb_path_query(link, '$[*].other.type') #>> '{}');
    $$;

    CREATE OR REPLACE PROCEDURE fhir.service_request_resolve_upstream_specimen()
    LANGUAGE SQL
    AS $$
      -- Resolve the specimen of service request
      UPDATE fhir.service_requests sr
      SET 
        specimen = '[]' ||
          jsonb_build_object(
            'reference', 'Specimen/' || s.id,
            'type', 'Specimen'
          ),
        last_updated = now()
      FROM fhir.specimens s
      WHERE true
        AND jsonb_extract_path_text(sr.specimen, 'type') = 'upstream://specimen'
        AND s.upstream_id::text = jsonb_extract_path_text(sr.specimen, 'reference');

      -- Mark remaining unresolved service requests as unresolved
      UPDATE fhir.service_requests sr
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(sr.specimen, 'type') = 'upstream://specimen';
    $$;

    CREATE OR REPLACE PROCEDURE fhir.service_requests_resolve_upstream_encounter()
    LANGUAGE SQL
    AS $$
      -- Resolve the encounter of service request
      UPDATE fhir.service_requests sr
      SET 
        encounter = jsonb_build_object(
          'reference', 'Encounter/' || e.id,
          'type', 'Encounter',
          'identifier', null,
          'display', null
        ),
        last_updated = now()
      FROM fhir.encounters e
      WHERE true
        AND jsonb_extract_path_text(sr.encounter, 'type') = 'upstream://encounter'
        AND e.upstream_id::text = jsonb_extract_path_text(sr.encounter, 'reference');

      -- Mark remaining unresolved service requests as unresolved
      UPDATE fhir.service_requests sr
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(sr.encounter, 'type') = 'upstream://encounter';
    $$;

    CREATE OR REPLACE PROCEDURE fhir.service_requests_resolve_upstream_practitioner()
    LANGUAGE SQL
    AS $$
      -- Resolve the practitioner of service request
      UPDATE fhir.service_requests sr
      SET 
        requester = jsonb_build_object(
          'reference', 'Practitioner/' || p.id,
          'type', 'Practitioner',
          'identifier', null,
          'display', p.name->0->>'text'
        ),
        last_updated = now()
      FROM fhir.practitioners p
      WHERE true
        AND jsonb_extract_path_text(sr.requester, 'type') = 'upstream://practitioner'
        AND p.upstream_id::text = jsonb_extract_path_text(sr.requester, 'reference');

      -- Mark remaining unresolved service requests as unresolved
      UPDATE fhir.service_requests sr
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(sr.requester, 'type') = 'upstream://practitioner';
    $$;

    CREATE OR REPLACE PROCEDURE fhir.service_requests_resolve_upstream_subject()
    LANGUAGE SQL
    AS $$
      -- Resolve the subject of service request
      UPDATE fhir.service_requests sr
        SET 
          subject = jsonb_build_object(
            'reference',
            'Patient/' || p.id,
            'type',
            'Patient',
            'identifier',
            jsonb_extract_path_text(sr.subject, 'identifier'),
            'display',
            jsonb_extract_path_text(sr.subject, 'display')
          ),
          last_updated = now()
        FROM fhir.patients p
        WHERE true
          AND jsonb_extract_path_text(sr.subject, 'type') = 'upstream://patient'
          AND p.upstream_id::text = jsonb_extract_path_text(sr.subject, 'reference');

        -- Mark remaining unresolved service requests as unresolved
        UPDATE fhir.service_requests sr
        SET 
          resolved = true
        WHERE jsonb_extract_path_text(sr.subject, 'type') = 'upstream://patient';
    $$;

    CREATE OR REPLACE PROCEDURE fhir.specimen_resolve_upstream_practitioner()
    LANGUAGE SQL
    AS $$
      -- Resolve the practitioner of specimen
      UPDATE fhir.specimens s
      SET 
        collection = collection 
          || jsonb_build_object(
              'collector', 
                jsonb_build_object(
                  'reference', 'Practitioner/' || p.id,
                  'type', 'Practitioner',
                  'display', jsonb_extract_path_text(p.name -> 0, 'text')
                )
          ),
        last_updated = now()
      FROM fhir.practitioners p
      WHERE true
        AND jsonb_extract_path_text(s.collection, 'collector', 'type') = 'upstream://practitioner'
        AND p.upstream_id::text = jsonb_extract_path_text(s.collection, 'collector', 'reference');

      -- Mark remaining unresolved specimens as unresolved
      UPDATE fhir.specimens s
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(s.collection, 'collector', 'type') = 'upstream://practitioner';
    $$;

    CREATE OR REPLACE PROCEDURE fhir.specimen_resolve_upstream_service_request()
    LANGUAGE SQL
    AS $$
      -- Resolve the service request of specimen
      UPDATE fhir.specimens s
      SET 
        request = to_jsonb(
          ARRAY[
            jsonb_build_object(
              'reference', 'ServiceRequest/' || sr.id,
              'type', 'ServiceRequest'
            )
          ]),
        last_updated = now()
      FROM fhir.service_requests sr
      WHERE true
        AND jsonb_extract_path_text(s.request -> 0, 'type') = 'upstream://service_request'
        AND sr.upstream_id::text = jsonb_extract_path_text(s.request -> 0, 'reference');

      -- Mark remaining unresolved specimens as unresolved
      UPDATE fhir.specimens s
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(s.request -> 0, 'type') = 'upstream://service_request';
    $$;
  `);
}

export async function down(query) {
  await query.sequelize.query(`
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
    $$;

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
    $$;

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
    $$;

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

    CREATE OR REPLACE PROCEDURE fhir.service_requests_resolve_upstream_encounter()
    LANGUAGE SQL
    AS $$
      UPDATE fhir.service_requests sr
      SET encounter = jsonb_build_object(
          'reference', 'Encounter/' || e.id,
          'type', 'Encounter',
          'identifier', null,
          'display', null
        )
      FROM fhir.encounters e
      WHERE true
        AND jsonb_extract_path_text(sr.encounter, 'type') = 'upstream://encounter'
        AND e.upstream_id::text = jsonb_extract_path_text(sr.encounter, 'reference')
    $$;

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
    $$;

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
    $$;

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
}
