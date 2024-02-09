
const schema = 'fhir';
const tableName = 'service_requests';
const column = 'contained';

export async function up(query) {
  await query.sequelize.query(`
    ALTER TABLE ${schema}.${tableName} DROP COLUMN ${column};
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE ${schema}.${tableName} 
      ADD COLUMN ${column} jsonb;
  `);
}
