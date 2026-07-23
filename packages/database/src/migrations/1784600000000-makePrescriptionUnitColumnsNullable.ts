import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.changeColumn('prescriptions', 'dosing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.changeColumn('prescriptions', 'dispensing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.changeColumn('prescriptions', 'dosing_unit', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await queryInterface.changeColumn('prescriptions', 'dispensing_unit', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}
