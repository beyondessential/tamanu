import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Remove the per-user device_registration_quota column.
 *
 * Device registration is now controlled via role-based permissions:
 * - 'create' on 'SingleDeviceRegistration' = can register single device
 * - 'create' on 'UnlimitedDeviceRegistration' = can register unlimited devices
 *
 * Admins should configure these permissions on roles as needed.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn('users', 'device_registration_quota');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.addColumn('users', 'device_registration_quota', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}
