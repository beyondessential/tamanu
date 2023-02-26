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

const UUID_COLUMNS = ['id', 'version_id'];

// All FHIR types that are an array have/need default values -
// this is a helper function to check that.
function isFhirTypeArray(typeName) {
  return typeName.slice(-2) === '[]';
}

// Down migrations will get rid of all data, which
// essentially means that a downtime will be needed to wait for
// rematerialisation.
export async function up(query) {
  // Alter tables
  for (const [tableName, columns] of Object.entries(TABLES)) {
    // Change UUIDs columns
    for (const columnName of UUID_COLUMNS) {
      await query.sequelize.query(`
        ALTER TABLE "fhir.${tableName}"
          ALTER COLUMN "${columnName}"
            TYPE VARCHAR(255)
      `);
    }

    // Alter FHIR-type columns
    for (const [columnName, columnType] of Object.entries(columns)) {
      if (isFhirTypeArray(columnType)) {
        await query.sequelize.query(`
          ALTER TABLE "fhir.${tableName}"
            ALTER COLUMN "${columnName}"
              DROP DEFAULT
        `);
      }
      await query.sequelize.query(`
        ALTER TABLE "fhir.${tableName}"
          ALTER COLUMN "${columnName}"
            TYPE JSONB
              USING to_json("value")::jsonb
      `);
    }
  }

  // Drop all FHIR types
  await query.sequelize.query('DROP TYPE fhir.address');
  await query.sequelize.query('DROP TYPE fhir.contact_point');
  await query.sequelize.query('DROP TYPE fhir.human_name');
  await query.sequelize.query('DROP TYPE fhir.codeable_concept');
  await query.sequelize.query('DROP TYPE fhir.coding');
  await query.sequelize.query('DROP TYPE fhir.period');
  await query.sequelize.query('DROP TYPE fhir.identifier');
  await query.sequelize.query('DROP TYPE fhir.reference');
  await query.sequelize.query('DROP TYPE fhir.patient_link');
  await query.sequelize.query('DROP TYPE fhir.immunization_protocol_applied');
  await query.sequelize.query('DROP TYPE fhir.immunization_performer');
  await query.sequelize.query('DROP TYPE fhir.extension');
  await query.sequelize.query(`DROP TYPE fhir.annotation`);
}

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
    // Change UUIDs columns
    for (const columnName of UUID_COLUMNS) {
      await query.sequelize.query(`
        ALTER TABLE "fhir.${tableName}"
          ALTER COLUMN "${columnName}"
            TYPE UUID
      `);
    }

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
}
