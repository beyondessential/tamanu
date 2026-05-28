import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('reference_drugs', 'dosing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('reference_drugs', 'dispensing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('reference_drugs', 'unit_conversion', {
    type: DataTypes.DECIMAL,
    allowNull: false,
    defaultValue: 1,
  });
  await queryInterface.addColumn('prescriptions', 'dosing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('prescriptions', 'dispensing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('reference_medication_templates', 'dosing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn('reference_medication_templates', 'dosing_unit');
  await queryInterface.removeColumn('prescriptions', 'dispensing_unit');
  await queryInterface.removeColumn('prescriptions', 'dosing_unit');
  await queryInterface.removeColumn('reference_drugs', 'unit_conversion');
  await queryInterface.removeColumn('reference_drugs', 'dispensing_unit');
  await queryInterface.removeColumn('reference_drugs', 'dosing_unit');
}
