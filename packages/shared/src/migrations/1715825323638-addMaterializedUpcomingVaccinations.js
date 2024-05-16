export async function up(query) {
  await query.sequelize.query(`
  CREATE MATERIALIZED VIEW materialized_upcoming_vaccinations AS
  SELECT *, now() as last_refreshed
  FROM upcoming_vaccinations
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP MATERIALIZED VIEW materialized_upcoming_vaccinations;');
}
