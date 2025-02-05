import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('users', 'device_registration_quota', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('users', 'device_registration_quota');
}
