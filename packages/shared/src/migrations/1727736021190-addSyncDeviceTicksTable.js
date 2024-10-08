import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable('sync_device_ticks', {
    id: {
      type: `BIGINT GENERATED ALWAYS AS ("persisted_at_sync_tick") STORED`,
    },
    persisted_at_sync_tick: {
      primaryKey: true,
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  await query.addIndex('sync_device_ticks', {
    fields: ['persisted_at_sync_tick'],
  });
}

export async function down(query) {
  await query.dropTable('sync_device_ticks');
}
