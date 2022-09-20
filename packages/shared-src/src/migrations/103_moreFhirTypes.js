import config from 'config';

export async function up(query) {
  if (config.serverFacilityId) return;

  await query.sequelize.query(`CREATE TYPE fhir.immunization_performer AS (
    actor                varchar(255)
  )`);

  await query.sequelize.query(`CREATE TYPE fhir.immunization_protocol_applied AS (
    dose_number_string   text
  )`);
}

export async function down(query) {
  if (config.serverFacilityId) return;

  await query.sequelize.query('DROP TYPE fhir.immunization_protocol_applied');
  await query.sequelize.query('DROP TYPE fhir.immunization_performer');
}
