
const schema = 'fhir';
const tableName = 'service_requests';
const column = 'contained';

export async function up(query) {
  await query.sequelize.query(`
    ALTER TABLE fhir.service_requests
      DROP COLUMN contained
    ;
  `);

  await query.sequelize.query(`
    ALTER TABLE fhir.service_requests
      ADD COLUMN specimen jsonb
    ;
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE fhir.service_requests 
      DROP COLUMN specimen
    ;
  `);

  await query.sequelize.query(`
  ALTER TABLE fhir.service_requests 
    ADD COLUMN contained jsonb
  ;
`);
}
