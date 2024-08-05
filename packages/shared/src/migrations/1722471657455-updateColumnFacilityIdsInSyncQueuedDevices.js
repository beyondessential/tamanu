import { DataTypes } from 'sequelize';
export async function up(query) {
  await query.removeColumn('sync_queued_devices', 'facility_id');
  await query.addColumn('sync_queued_devices', 'facility_ids', {
    type: DataTypes.TEXT,
    allowNull: false,
  });
}

export async function down(query) {
  await query.removeColumn('sync_queued_devices', 'facility_ids');
  await query.addColumn('sync_queued_devices', 'facility_id', {
    type: DataTypes.STRING,
    references: {
      model: 'facilities',
      key: 'id',
    },
    allowNull: false,
  });
}
