const TABLES_FOR_REFRESH = ['note_pages', 'note_items'];

export async function up(query) {
  for (const table of TABLES_FOR_REFRESH) {
    await query.sequelize.query(`
      CREATE TRIGGER fhir_refresh
      AFTER INSERT OR UPDATE OR DELETE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger()
    `);
  }
}

export async function down(query) {
  for (const table of TABLES_FOR_REFRESH) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS fhir_refresh ON ${table}`);
  }
}
