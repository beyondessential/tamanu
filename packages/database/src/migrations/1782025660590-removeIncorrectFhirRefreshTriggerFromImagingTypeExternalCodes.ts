import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // imaging_type_external_codes is not a FHIR upstream table; the trigger was added incorrectly
  // when the table was created near the time other fhir_refresh triggers were being consolidated.
  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS fhir_refresh ON imaging_type_external_codes;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE TRIGGER fhir_refresh
    AFTER INSERT OR UPDATE OR DELETE ON imaging_type_external_codes FOR EACH ROW
    EXECUTE FUNCTION fhir.refresh_trigger()
  `);
}
