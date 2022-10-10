export async function up(query) {
  await query.sequelize.query(`CREATE TYPE fhir.reference AS (
    reference       text,
    type            text,
    identifier      fhir.identifier,
    display         text
  )`);

  await query.sequelize.query(`ALTER TYPE fhir.identifier ALTER ATTRIBUTE assigner SET DATA TYPE fhir.reference`);
}

export async function down(query) {
  await query.sequelize.query(`ALTER TYPE fhir.identifier ALTER ATTRIBUTE assigner SET DATA TYPE text`);
  await query.sequelize.query('DROP TYPE fhir.reference');
}
