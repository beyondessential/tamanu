import { QueryInterface } from 'sequelize';

const TABLES_FOR_REFRESH = ['pharmacy_orders', 'pharmacy_order_prescriptions'];

export async function up(query: QueryInterface): Promise<void> {
  for (const table of TABLES_FOR_REFRESH) {
    await query.sequelize.query(`
      CREATE TRIGGER fhir_refresh
      AFTER INSERT OR UPDATE OR DELETE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger()
    `);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const table of TABLES_FOR_REFRESH) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS fhir_refresh ON ${table}`);
  }
}
