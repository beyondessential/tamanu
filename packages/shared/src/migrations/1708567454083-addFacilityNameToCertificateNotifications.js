import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('certificate_notifications', 'facility_name', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('certificate_notifications', 'facility_name');
}
