import { DataTypes } from 'sequelize';
export async function up(query) {
  await query.dropColumn('sync_queued_devices', 'facility_id');
  await query.addColumn('sync_queued_devices', 'facility_ids', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await query.sequelize.query(`
      UPDATE sync_queued_devices
       SET
        facility_ids = facility_id_legacy;
    `);
}

export async function down(query) {
  await query.dropColumn('sync_queued_devices', 'facility_ids');
  await query.addColumn('sync_queued_devices', 'facility_id', {
    type: DataTypes.STRING,
    references: {
      model: 'facilities',
      key: 'id',
    },
    allowNull: false,
  });
}
