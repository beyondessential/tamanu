export async function up(query) {
  await query.createSchema('fhir', {});

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

  await query.sequelize.query(`CREATE TYPE fhir.identifier AS (
    use             text,
    type            fhir.codeable_concept,
    system          text,
    value           text,
    period          fhir.period,
    assigner        text
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
}

export async function down(query) {
  await query.sequelize.query('DROP TYPE fhir.address');
  await query.sequelize.query('DROP TYPE fhir.contact_point');
  await query.sequelize.query('DROP TYPE fhir.human_name');
  await query.sequelize.query('DROP TYPE fhir.identifier');
  await query.sequelize.query('DROP TYPE fhir.codeable_concept');
  await query.sequelize.query('DROP TYPE fhir.coding');
  await query.sequelize.query('DROP TYPE fhir.period');
  await query.dropSchema('fhir');
}
