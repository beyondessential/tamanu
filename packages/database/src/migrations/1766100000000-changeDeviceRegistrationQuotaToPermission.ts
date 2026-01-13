import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Add the new permission column
  await query.addColumn('users', 'device_registration_permission', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'none',
  });

  // Migrate existing data: 0 -> 'none', 1 -> 'single', >1 -> 'unlimited'
  await query.sequelize.query(`
    UPDATE users
    SET device_registration_permission = CASE
      WHEN device_registration_quota = 0 THEN 'none'
      WHEN device_registration_quota = 1 THEN 'single'
      ELSE 'unlimited'
    END
  `);

  // Remove the old column
  await query.removeColumn('users', 'device_registration_quota');
}

export async function down(query: QueryInterface): Promise<void> {
  // Add the old quota column back
  await query.addColumn('users', 'device_registration_quota', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  // Migrate data back: 'none' -> 0, 'single' -> 1, 'unlimited' -> 999
  await query.sequelize.query(`
    UPDATE users
    SET device_registration_quota = CASE
      WHEN device_registration_permission = 'none' THEN 0
      WHEN device_registration_permission = 'single' THEN 1
      ELSE 999
    END
  `);

  // Remove the new column
  await query.removeColumn('users', 'device_registration_permission');
}
