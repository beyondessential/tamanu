import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('settings', 'device_id', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  // Server-scope rows (machine-level settings) are keyed by device rather than
  // facility: many devices' rows share facility_id NULL, so they must be carved
  // out of the without-facility uniqueness and given their own per-device one.
  await query.sequelize.query('DROP INDEX settings_alive_key_unique_without_facility_idx');
  await query.sequelize.query(`
    CREATE UNIQUE INDEX settings_alive_key_unique_without_facility_idx
    ON settings (key, scope)
    WHERE deleted_at IS NULL AND facility_id IS NULL AND device_id IS NULL
  `);
  await query.sequelize.query(`
    CREATE UNIQUE INDEX settings_alive_key_unique_per_device_idx
    ON settings (key, device_id)
    WHERE deleted_at IS NULL AND device_id IS NOT NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // Dropping the column also drops the per-device partial index. Restoring the
  // original uniqueness fails loudly if device-keyed rows exist (they'd collide
  // on (key, scope) once the device column is gone) — remove them first by hand.
  await query.removeColumn('settings', 'device_id');
  await query.sequelize.query('DROP INDEX settings_alive_key_unique_without_facility_idx');
  await query.sequelize.query(`
    CREATE UNIQUE INDEX settings_alive_key_unique_without_facility_idx
    ON settings (key, scope)
    WHERE deleted_at IS NULL AND facility_id IS NULL
  `);
}
