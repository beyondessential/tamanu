import { DataTypes } from 'sequelize';
export async function up(query) {
  await query.addColumn('sync_queued_devices', 'facility_ids', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.renameColumn('sync_queued_devices', 'facility_id', 'facility_id_legacy', {
    type: DataTypes.STRING,
    references: {
      model: 'facilities',
      key: 'id',
    },
    allowNull: true,
  });
  await query.sequelize.query(`
      UPDATE sync_queued_devices
       SET
        facility_ids = facility_id_legacy;
    `);
}

export async function down(query) {
  await query.removeColumn('sync_queued_devices', 'facility_ids');
  await query.renameColumn('sync_queued_devices', 'facility_id_legacy', 'facility_id', {
    type: DataTypes.STRING,
    references: {
      model: 'facilities',
      key: 'id',
    },
    allowNull: false,
  });
}
