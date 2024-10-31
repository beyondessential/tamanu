import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('appointments', 'appointment_type_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });
  await query.renameColumn('appointments', 'type', 'type_legacy');
}

export async function down(query) {
  await query.removeColumn('appointments', 'appointment_type_id');
  await query.renameColumn('appointments', 'type_legacy', 'type');
}
