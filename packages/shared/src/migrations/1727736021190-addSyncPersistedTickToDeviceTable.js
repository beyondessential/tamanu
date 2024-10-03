import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable('sync_persisted_tick_to_device', {
    persisted_at_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  await query.addIndex('sync_persisted_tick_to_device', {
    fields: ['persisted_at_sync_tick'],
  });
}

export async function down(query) {
  await query.dropTable('sync_persisted_tick_to_device');
}
