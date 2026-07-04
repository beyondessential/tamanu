import { DataTypes, QueryInterface } from 'sequelize';

// Routing dimension for device-targeted records (currently server-scope
// settings): a lookup row with device_id set syncs only to the session pulling
// with that device id. Distinct from pushed_by_device_id, which tracks who
// pushed a record for echo suppression.
//
// The partial index is load-bearing: without it the snapshot query's
// `OR device_id = :deviceId` arm is unindexable and the planner abandons the
// tick index for a full seq scan on every chunk (benchmarked 4x slower on 3M
// rows; far worse on production-sized tables). With it, the device arm joins
// the existing BitmapOr at negligible cost.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('sync_lookup', 'device_id', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await query.sequelize.query(`
    CREATE INDEX sync_lookup_device_id_idx
    ON sync_lookup (device_id)
    WHERE device_id IS NOT NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('sync_lookup', 'device_id');
}
