const TABLES = {
  patients: {
    identifier: 'fhir.identifier[]',
    name: 'fhir.human_name[]',
    telecom: 'fhir.contact_point[]',
    address: 'fhir.address[]',
    link: 'fhir.patient_link[]',
    extension: 'fhir.extension[]',
  },
  service_requests: {
    identifier: 'fhir.identifier[]',
    category: 'fhir.codeable_concept[]',
    order_detail: 'fhir.codeable_concept[]',
    location_code: 'fhir.codeable_concept[]',
    code: 'fhir.codeable_concept',
    subject: 'fhir.reference',
    requester: 'fhir.reference',
  },
  diagnostic_reports: {
    extension: 'fhir.extension[]',
    identifier: 'fhir.identifier[]',
    code: 'fhir.codeable_concept',
    subject: 'fhir.reference',
    performer: 'fhir.reference[]',
    result: 'fhir.reference[]',
  },
  immunizations: {
    vaccine_code: 'fhir.codeable_concept',
    patient: 'fhir.reference',
    encounter: 'fhir.reference',
    site: 'fhir.codeable_concept[]',
    performer: 'fhir.immunization_performer[]',
    protocol_applied: 'fhir.immunization_protocol_applied[]',
  },
};

// All FHIR types that are an array have/need default values -
// this is a helper function to check that.
function isFhirTypeArray(typeName) {
  return typeName.slice(-2) === '[]';
}

export async function up(query) {
  // Alter tables
  for (const [tableName, columns] of Object.entries(TABLES)) {
    // Alter FHIR-type columns
    for (const [columnName, columnType] of Object.entries(columns)) {
      if (isFhirTypeArray(columnType)) {
        await query.sequelize.query(`
          ALTER TABLE fhir.${tableName}
            ALTER COLUMN ${columnName}
              DROP DEFAULT
        `);
      }
      await query.sequelize.query(`
        ALTER TABLE fhir.${tableName}
          ALTER COLUMN ${columnName}
            TYPE JSONB
              USING to_json(${columnName})::jsonb
      `);
      if (isFhirTypeArray(columnType)) {
        await query.sequelize.query(`
          ALTER TABLE fhir.${tableName}
            ALTER COLUMN ${columnName}
              SET DEFAULT '[]'::jsonb
        `);
      }
    }
  }

  // Drop all FHIR types
  await query.sequelize.query('DROP TYPE fhir.address');
  await query.sequelize.query('DROP TYPE fhir.contact_point');
  await query.sequelize.query('DROP TYPE fhir.human_name');
  await query.sequelize.query('DROP TYPE fhir.patient_link');
  await query.sequelize.query('DROP TYPE fhir.immunization_protocol_applied');
  await query.sequelize.query('DROP TYPE fhir.immunization_performer');
  await query.sequelize.query('DROP TYPE fhir.extension');
  await query.sequelize.query(`DROP TYPE fhir.annotation`);
  await query.sequelize.query('DROP TYPE fhir.identifier');
  await query.sequelize.query('DROP TYPE fhir.period');
  await query.sequelize.query('DROP TYPE fhir.reference');
  await query.sequelize.query('DROP TYPE fhir.codeable_concept');
  await query.sequelize.query('DROP TYPE fhir.coding');

  // Change procedures
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

// Down migration will get rid of all data, which
// essentially means that downtime will be needed to wait for
// rematerialisation.
export async function down(query) {
  // From 100_fhirTypes.js except identifier
  // which was changed on a more recent migration
  await query.sequelize.query(`CREATE TYPE fhir.period AS (
    "start"         date_time_string,
    "end"           date_time_string
  )`);
  await query.sequelize.query(`CREATE TYPE fhir.coding AS (
    system          text,
    version         text,
    code            text,
    display         text,
    user_selected   boolean
  )`);
  await query.sequelize.query(`CREATE TYPE fhir.codeable_concept AS (
    coding          fhir.coding[],
    text            text
  )`);
  await query.sequelize.query(`CREATE TYPE fhir.human_name AS (
    use             text,
    text            text,
    family          text,
    given           text[],
    prefix          text[],
    suffix          text[],
    period          fhir.period
  )`);
  await query.sequelize.query(`CREATE TYPE fhir.contact_point AS (
    system          text,
    value           text,
    use             text,
    rank            integer,
    period          fhir.period
  )`);
  await query.sequelize.query(`CREATE TYPE fhir.address AS (
    use             text,
    type            text,
    text            text,
    line            text[],
    city            text,
    district        text,
    state           text,
    postal_code     text,
    country         text,
    period          fhir.period
  )`);

  // From 115_fhirReferences.js (new_identifier simply renamed here to identifier)
  await query.sequelize.query(`
    CREATE TYPE fhir.reference AS (
      reference       text,
      type            text,
      identifier      jsonb,
      display         text
    )
  `);
  await query.sequelize.query(`
    CREATE TYPE fhir.identifier AS (
      use             text,
      type            fhir.codeable_concept,
      system          text,
      value           text,
      period          fhir.period,
      assigner        fhir.reference
    )
  `);

  // From 116_fhirPatientLinks.js
  await query.sequelize.query(`
    CREATE TYPE fhir.patient_link AS (
      other           fhir.reference,
      type            text
    )
  `);

  // From 148_moreFhirTypes.js
  await query.sequelize.query(`CREATE TYPE fhir.immunization_performer AS (
    function                    fhir.codeable_concept,
    actor                       fhir.reference
  )`);
  await query.sequelize.query(`CREATE TYPE fhir.immunization_protocol_applied AS (
    series                      text,
    authority                   fhir.reference,
    target_disease              fhir.codeable_concept[],
    dose_number_positive_int    integer,
    dose_number_string          text,
    series_doses_positive_int   integer,
    series_doses_string         text
  )`);
  await query.sequelize.query(`CREATE TYPE fhir.extension AS (
    url                         text,
    value_codeable_concept      fhir.codeable_concept
  )`);

  // From 1669241407944-fhirDatatypeAnnotation.js
  await query.sequelize.query(`
    CREATE TYPE fhir.annotation AS (
      authorReference fhir.reference,
      authorString    text,
      time            timestamptz,
      text            text
    );

    COMMENT ON TYPE fhir.annotation IS 'The text field of the annotation is required, and the author fields are mutually exclusive, but this is enforced in the application layer.';
  `);

  // Truncate and alter tables
  for (const [tableName, columns] of Object.entries(TABLES)) {
    await query.sequelize.query(`TRUNCATE TABLE fhir.${tableName}`);

    const table = { schema: 'fhir', tableName };
    // Alter FHIR-type columns
    for (const [columnName, columnType] of Object.entries(columns)) {
      await query.removeColumn(table, columnName);

      if (isFhirTypeArray(columnType)) {
        await query.addColumn(table, columnName, {
          type: columnType,
          allowNull: false,
          defaultValue: '{}',
        });
      } else {
        await query.addColumn(table, columnName, {
          type: columnType,
        });
      }
    }
  }

  // Change procedures
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
