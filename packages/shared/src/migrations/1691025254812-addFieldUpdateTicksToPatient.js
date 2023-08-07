import Sequelize from 'sequelize';

const CURRENT_SYNC_TICK_KEY = 'currentSyncTick';

const METADATA_FIELDS = [
  'created_at',
  'updated_at',
  'deleted_at',
  'updated_at_sync_tick',
  'updated_at_by_field',
];

export async function up(query) {
  await query.addColumn('patients', 'updated_at_by_field', {
    type: Sequelize.JSON,
  });
  await query.sequelize.query(`
    CREATE TRIGGER set_patients_updated_at_by_field
    BEFORE INSERT OR UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_by_field();
  `);
  await query.sequelize.query(`
    -- an initial empty object
    UPDATE
      patients
    SET
      updated_at_by_field = '{}'::json;

    -- set sync tick for all fields that aren't null
    UPDATE
      patients
    SET
      updated_at_by_field = (
        SELECT JSON_OBJECT_AGG(row_as_json.key, (SELECT value::bigint FROM local_system_facts WHERE key = '${CURRENT_SYNC_TICK_KEY}'))::jsonb
        FROM
          jsonb_each(row_to_json(patients)::jsonb) AS row_as_json
        WHERE
          row_as_json.value <> 'null'::jsonb
        AND
          row_as_json.key NOT IN (${METADATA_FIELDS.map(m => `'${m}'`).join(',')})
      );
  `);
}

export async function down(query) {
  await query.removeColumn('patients', 'updated_at_by_field');
  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS set_patients_updated_at_by_field
    ON patients;
  `);
}
