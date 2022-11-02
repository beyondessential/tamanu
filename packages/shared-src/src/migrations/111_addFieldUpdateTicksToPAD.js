import Sequelize from 'sequelize';

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
        SELECT JSON_OBJECT_AGG(row_as_json.key, (SELECT last_value FROM sync_clock_sequence))::jsonb
        FROM
          jsonb_each(row_to_json(patient_additional_data)::jsonb) AS row_as_json
        WHERE
          row_as_json.value <> 'null'::jsonb
        AND
          row_as_json.key <> 'updated_at_sync_tick'
        AND
          row_as_json.key <> 'updated_at_by_field'
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
