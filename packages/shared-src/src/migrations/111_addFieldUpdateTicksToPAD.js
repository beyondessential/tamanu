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
}

export async function down(query) {
  await query.removeColumn('patient_additional_data', 'updated_at_by_field');
  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS set_patient_additional_data_updated_at_by_field
    ON patient_additional_data;
  `);
}
