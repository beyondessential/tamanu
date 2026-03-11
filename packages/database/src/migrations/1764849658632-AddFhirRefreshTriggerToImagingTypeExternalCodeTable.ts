import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // write your up migration here

  // This migration should only exist on versions of Tamanu that haven't had the
  // fhir_refresh triggers replaced with the automatically added triggers.
  const [queryResult] = await query.sequelize.query(`
    SELECT EXISTS(
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name = 'fhir_refresh'
      AND event_object_table = 'imaging_type_external_codes'
    )
  `);
  if (queryResult.length > 0 && (queryResult[0] as { exists: boolean }).exists) {
    throw new Error(
      "This migration shouldn't be running on a version of Tamanu that has switched to automatically managed fhir_refresh triggers. Please remove this migration from the commit.",
    );
  }

  await query.sequelize.query(`
    CREATE TRIGGER fhir_refresh
    AFTER INSERT OR UPDATE OR DELETE ON imaging_type_external_codes
    FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger()
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP TRIGGER IF EXISTS fhir_refresh ON imaging_type_external_codes`);
}
