import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('devices', 'last_successful_sync_push', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('devices', 'last_successful_sync_push');
}
