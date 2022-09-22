import { Sequelize } from 'sequelize';

const RESOURCE_TABLES = ['patients', 'practitioners', 'service_requests'];

export async function up(query) {
  for (const table of RESOURCE_TABLES) {
    await query.sequelize.query(`
      CREATE OR REPLACE FUNCTION fhir.trigger_versioning_${table}()
      RETURNS TRIGGER LANGUAGE plpgsql VOLATILE
      AS $vers$
        BEGIN
          NEW.version_id := uuid_generate_v4();
          RETURN NEW;
        END;
      $vers$
    `);

    await query.sequelize.query(`
      CREATE TRIGGER versioning BEFORE UPDATE ON fhir.${table}
      FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning_${table}()
    `);
  }
}

export async function down(query) {
  for (const table of RESOURCE_TABLES) {
    await query.sequelize.query(`DROP TRIGGER versioning ON fhir.${table}`);
    await query.sequelize.query(`DROP FUNCTION fhir.trigger_versioning_${table}`);
  }
}
