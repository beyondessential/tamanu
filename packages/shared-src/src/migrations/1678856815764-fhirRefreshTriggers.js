const UPSTREAMS = [
  'administered_vaccines',
  'encounters',
  'facilities',
  'imaging_area_external_codes',
  'imaging_request_areas',
  'imaging_requests',
  'lab_requests',
  'lab_test_types',
  'lab_tests',
  'location_groups',
  'locations',
  'patient_additional_data',
  'patients',
  'reference_data',
  'scheduled_vaccines',
  'users',
];

export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.refresh_trigger()
      RETURNS TRIGGER
      LANGUAGE PLPGSQL
    AS $$
    DECLARE
      payload JSONB;
    BEGIN
      payload := jsonb_build_object(
        'table', (TG_TABLE_SCHEMA::text || '.' || TG_TABLE_NAME::text),
        'op', TG_OP,
        'id', COALESCE(NEW.id, OLD.id)::text,
        'args', to_jsonb(TG_ARGV)
      );
      
      IF TG_OP = 'DELETE' THEN
        payload := payload || jsonb_build_object('deletedRow', OLD);
      END IF;

      PERFORM fhir.job_submit('fhir.refresh.allFromUpstream', payload);
      RETURN NEW;
    END;
    $$
  `);

  for (const table of UPSTREAMS) {
    await query.sequelize.query(`
      CREATE TRIGGER fhir_refresh
      AFTER INSERT OR UPDATE OR DELETE ON ${table} FOR EACH ROW
      EXECUTE FUNCTION fhir.refresh_trigger()
    `);
  }
}

export async function down(query) {
  for (const table of UPSTREAMS) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS fhir_refresh ON ${table}`);
  }

  await query.sequelize.query(`DROP FUNCTION IF EXISTS fhir.refresh_trigger()`);
}
