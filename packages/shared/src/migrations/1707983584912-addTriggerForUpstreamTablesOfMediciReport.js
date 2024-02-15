const TABLES_FOR_REFRESH = [
  'document_metadata',
  'encounter_diagnoses',
  'encounter_medications',
  'invoices',
  'procedures',
  'survey_responses',
  'triages',
  'vitals',
  'referrals'
];

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
