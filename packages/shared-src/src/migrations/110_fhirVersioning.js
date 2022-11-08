const RESOURCE_TABLES = ['patients', 'practitioners', 'service_requests'];

export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.trigger_versioning()
    RETURNS TRIGGER LANGUAGE plpgsql VOLATILE
    AS $vers$
      BEGIN
        NEW.version_id := uuid_generate_v4();
        RETURN NEW;
      END;
    $vers$
  `);

  for (const table of RESOURCE_TABLES) {
    await query.sequelize.query(`
      CREATE TRIGGER versioning BEFORE UPDATE ON fhir.${table}
      FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning()
    `);
  }
}

export async function down(query) {
  for (const table of RESOURCE_TABLES) {
    await query.sequelize.query(`DROP TRIGGER versioning ON fhir.${table}`);
  }

  await query.sequelize.query(`DROP FUNCTION fhir.trigger_versioning`);
}
