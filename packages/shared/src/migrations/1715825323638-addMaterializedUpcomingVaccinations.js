export async function up(query) {
  await query.sequelize.query(`
    CREATE MATERIALIZED VIEW materialized_upcoming_vaccinations AS
    SELECT *
    FROM upcoming_vaccinations
  `);
  // There is a requirement of a unique index on the materialized view
  // in order to refresh concurrently
  await query.sequelize.query(`
    CREATE UNIQUE INDEX materialized_upcoming_vaccinations_unique_index
    ON materialized_upcoming_vaccinations (patient_id, scheduled_vaccine_id);
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP MATERIALIZED VIEW materialized_upcoming_vaccinations;');
}
