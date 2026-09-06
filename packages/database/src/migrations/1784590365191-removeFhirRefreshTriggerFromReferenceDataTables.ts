import { QueryInterface } from 'sequelize';

// Tables that currently do carry a live fhir_refresh trigger (they're listed as an incidental
// upstream of one or more FHIR resources, e.g. a location name shown on a materialised encounter),
// which we're switching off here.
const REFERENCE_DATA_TABLES_WITH_FHIR_TRIGGER = [
  'reference_data',
  'departments',
  'locations',
  'location_groups',
  'lab_test_types',
  'lab_test_panels',
  'scheduled_vaccines',
  'imaging_area_external_codes',
  'imaging_type_external_codes',
];

export async function up(query: QueryInterface): Promise<void> {
  // Reference data (and reference-data-like config/master data such as lab test types or location
  // groups) changes should no longer queue a FHIR rematerialisation on their own. This data is
  // still read when a resource is rematerialised for some other reason, so eventual drift between
  // it and already-materialised resources is accepted.
  for (const table of REFERENCE_DATA_TABLES_WITH_FHIR_TRIGGER) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS "fhir_refresh_${table}" ON "${table}"`);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: any FHIR rematerialisation jobs that these changes would have queued between
  // up() and down() were never created, so they can't be replayed here.
  for (const table of REFERENCE_DATA_TABLES_WITH_FHIR_TRIGGER) {
    await query.sequelize.query(`
      DO $block$ BEGIN
        CREATE TRIGGER "fhir_refresh_${table}"
          AFTER INSERT OR UPDATE OR DELETE ON "${table}"
          FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END $block$;
    `);
  }
}
