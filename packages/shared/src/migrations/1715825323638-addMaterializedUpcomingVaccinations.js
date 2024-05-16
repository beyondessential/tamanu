export async function up(query) {
  await query.sequelize.query(`
  CREATE MATERIALIZED VIEW materialized_upcoming_vaccinations AS
  SELECT *,
  patient_id || scheduled_vaccine_id as composite_id
  FROM upcoming_vaccinations
  `);
  // Materialized view requires a unique index to refresh concurrently
  await query.sequelize.query(
    `CREATE UNIQUE INDEX materialized_upcoming_vaccinations_id_idx
    ON materialized_upcoming_vaccinations(composite_id);`,
  );
}

export async function down(query) {
  await query.sequelize.query('DROP MATERIALIZED VIEW materialized_upcoming_vaccinations;');
}
