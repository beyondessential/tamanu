const TABLES_FOR_REFRESH = ['patient_birth_data', 'encounter_history', 'departments'];

const TABLES_TO_DROP_REFRESH = [
  'document_metadata',
  'invoices',
  'survey_responses',
  'vitals',
  'referrals',
];

export async function up(query) {
  for (const table of TABLES_FOR_REFRESH) {
    await query.sequelize.query(`
      CREATE TRIGGER fhir_refresh
      AFTER INSERT OR UPDATE OR DELETE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger()
    `);
  }

  for (const table of TABLES_TO_DROP_REFRESH) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS fhir_refresh ON ${table}`);
  }
}

export async function down(query) {
  for (const table of TABLES_FOR_REFRESH) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS fhir_refresh ON ${table}`);
  }

  for (const table of TABLES_TO_DROP_REFRESH) {
    await query.sequelize.query(`
      CREATE TRIGGER fhir_refresh
      AFTER INSERT OR UPDATE OR DELETE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger()
    `);
  }
}
