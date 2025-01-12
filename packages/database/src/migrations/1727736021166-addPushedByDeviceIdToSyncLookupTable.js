import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_lookup', 'pushed_by_device_id', {
    type: DataTypes.TEXT,
  });
}

export async function down(query) {
  await query.removeColumn('sync_lookup', 'pushed_by_device_id');
}
