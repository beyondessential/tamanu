export async function up(query) {
  // a Reference's identifier is an Identifier, but we cannot have circular
  // types in postgres composites, so we break rank a little and specify that
  // a fhir.reference's identifier is JSON data instead. That way we can support
  // it if needed but also let's hope we don't have to.
  await query.sequelize.query(`
    CREATE TYPE fhir.reference AS (
      reference       text,
      type            text,
      identifier      jsonb,
      display         text
    )
  `);


  await query.sequelize.query(`ALTER TYPE fhir.identifier ALTER ATTRIBUTE assigner SET DATA TYPE fhir.reference`);
}

export async function down(query) {
  await query.sequelize.query(`ALTER TYPE fhir.identifier ALTER ATTRIBUTE assigner SET DATA TYPE text`);
  await query.sequelize.query('DROP TYPE fhir.reference');
}
