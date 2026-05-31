import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.changeColumn('reference_drugs', 'dosing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.changeColumn('reference_drugs', 'dispensing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.removeColumn('reference_drugs', 'units');

  await queryInterface.changeColumn('prescriptions', 'dosing_unit', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await queryInterface.changeColumn('prescriptions', 'dispensing_unit', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await queryInterface.changeColumn('prescriptions', 'unit_conversion', {
    type: DataTypes.DECIMAL,
    allowNull: false,
    defaultValue: 1,
  });
  await queryInterface.removeColumn('prescriptions', 'units');

  await queryInterface.changeColumn('reference_medication_templates', 'dosing_unit', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await queryInterface.removeColumn('reference_medication_templates', 'units');

  await queryInterface.sequelize.query(
    `SELECT flag_lookup_model_to_rebuild('reference_drugs')`,
  );
  await queryInterface.sequelize.query(
    `SELECT flag_lookup_model_to_rebuild('prescriptions')`,
  );
  await queryInterface.sequelize.query(
    `SELECT flag_lookup_model_to_rebuild('reference_medication_templates')`,
  );
}

// DESTRUCTIVE: re-adds units columns but values will not be restored
export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('reference_drugs', 'units', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('prescriptions', 'units', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.removeColumn('prescriptions', 'unit_conversion');
  await queryInterface.addColumn('reference_medication_templates', 'units', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
