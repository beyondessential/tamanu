import { QueryInterface } from 'sequelize';

const TABLES = [
  'administered_vaccines',
  'departments',
  'discharges',
  'encounter_diagnoses',
  'encounter_history',
  'encounters',
  'facilities',
  'imaging_area_external_codes',
  'imaging_request_areas',
  'imaging_requests',
  'lab_requests',
  'lab_test_panel_requests',
  'lab_test_panels',
  'lab_test_types',
  'lab_tests',
  'location_groups',
  'locations',
  'notes',
  'note_items',
  'note_pages',
  'patient_additional_data',
  'patient_birth_data',
  'patients',
  'pharmacy_order_prescriptions',
  'pharmacy_orders',
  'prescriptions',
  'procedures',
  'reference_data',
  'scheduled_vaccines',
  'triages',
  'users',
];

export async function up(query: QueryInterface): Promise<void> {
  // Removing old fhir_refresh triggers as we now have automatically added ones with the standard naming convention
  for (const table of TABLES) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS fhir_refresh ON ${table}`);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const table of TABLES) {
    await query.sequelize.query(
      `CREATE TRIGGER fhir_refresh
      AFTER INSERT OR UPDATE OR DELETE ON ${table} FOR EACH ROW
      EXECUTE FUNCTION fhir.refresh_trigger()`,
    );
  }
}
