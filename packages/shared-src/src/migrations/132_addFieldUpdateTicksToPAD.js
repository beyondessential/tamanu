import Sequelize from 'sequelize';

const CURRENT_SYNC_TIME_KEY = 'currentSyncTime';

const METADATA_FIELDS = [
  'created_at',
  'updated_at',
  'deleted_at',
  'updated_at_sync_tick',
  'updated_at_by_field',
];

export async function up(query) {
  await query.addColumn('patient_additional_data', 'updated_at_by_field', {
    type: Sequelize.JSON,
  });
  await query.sequelize.query(`
    CREATE TRIGGER set_patient_additional_data_updated_at_by_field
    BEFORE INSERT OR UPDATE ON patient_additional_data
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_by_field();
  `);
  await query.sequelize.query(`
    -- an initial empty object
    UPDATE
      patient_additional_data
    SET
      updated_at_by_field = '{}'::json;

    -- set sync tick for all fields that aren't null
    UPDATE
      patient_additional_data
    SET
      updated_at_by_field = (
        SELECT JSON_OBJECT_AGG(row_as_json.key, (SELECT value::bigint FROM local_system_facts WHERE key = '${CURRENT_SYNC_TIME_KEY}'))::jsonb
        FROM
          jsonb_each(row_to_json(patient_additional_data)::jsonb) AS row_as_json
        WHERE
          row_as_json.value <> 'null'::jsonb
        AND
          row_as_json.key NOT IN (${METADATA_FIELDS.map(m => `'${m}'`).join(',')})
      );
  `);
}

export async function down(query) {
  await query.removeColumn('patient_additional_data', 'updated_at_by_field');
  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS set_patient_additional_data_updated_at_by_field
    ON patient_additional_data;
  `);
}
