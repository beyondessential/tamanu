import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('certificate_notifications', 'facility_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'facilities',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.dropColumn('certificate_notifications', 'facility_id');
}
