export async function up(query) {
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
}

export async function down(query) {
  await query.sequelize.query('DROP TYPE fhir.immunization_protocol_applied');
  await query.sequelize.query('DROP TYPE fhir.immunization_performer');
  await query.sequelize.query('DROP TYPE fhir.extension');
}
