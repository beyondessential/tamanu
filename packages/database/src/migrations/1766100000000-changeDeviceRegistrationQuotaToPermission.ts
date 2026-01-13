import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Remove the per-user device_registration_quota column.
  // Device registration is now controlled via role-based permissions:
  // - 'create' verb on 'SingleDeviceRegistration' noun = can register single device
  // - 'create' verb on 'UnlimitedSingleDeviceRegistration' noun = can register unlimited devices
  //
  // Admins should configure these permissions on roles as needed.
  await query.removeColumn('users', 'device_registration_quota');
}

export async function down(query: QueryInterface): Promise<void> {
  // Restore the old quota column
  await query.addColumn('users', 'device_registration_quota', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}
