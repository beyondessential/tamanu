import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('imaging_requests', 'reason_for_cancellation', {
    type: DataTypes.STRING(31),
    allowNull: true,
  });
  await query.addColumn('lab_requests', 'reason_for_cancellation', {
    type: DataTypes.STRING(31),
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('imaging_requests', 'reason_for_cancellation');
  await query.removeColumn('lab_requests', 'reason_for_cancellation');
}
