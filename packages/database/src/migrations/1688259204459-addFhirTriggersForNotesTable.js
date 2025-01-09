export async function up(query) {
  await query.sequelize.query(`
      CREATE TRIGGER fhir_refresh
      AFTER INSERT OR UPDATE OR DELETE ON notes
      FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();
    `);
}

export async function down(query) {
  await query.sequelize.query(`DROP TRIGGER IF EXISTS fhir_refresh ON notes;`);
}
