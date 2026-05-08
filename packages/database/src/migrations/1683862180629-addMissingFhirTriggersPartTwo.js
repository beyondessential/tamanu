// Depending on whether we have to hotfix this or not
// some tables might need to get excluded here and taken care later
const TABLES_FOR_VERSIONING = ['encounters'];
const TABLES_FOR_REFRESH = ['discharges', 'lab_test_panel_requests', 'lab_test_panels'];

export async function up(query) {
  for (const table of TABLES_FOR_VERSIONING) {
    await query.sequelize.query(`
      CREATE TRIGGER versioning
      BEFORE UPDATE ON fhir.${table}
      FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning()
    `);
  }

  for (const table of TABLES_FOR_REFRESH) {
    await query.sequelize.query(`
      CREATE TRIGGER fhir_refresh
      AFTER INSERT OR UPDATE OR DELETE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger()
    `);
  }
}

export async function down(query) {
  for (const table of TABLES_FOR_VERSIONING) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS versioning ON fhir.${table}`);
  }

  for (const table of TABLES_FOR_REFRESH) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS fhir_refresh ON ${table}`);
  }
}
