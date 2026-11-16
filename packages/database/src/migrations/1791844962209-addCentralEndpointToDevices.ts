import { DataTypes, QueryInterface } from 'sequelize';

// Devices report which central endpoint they use when they start a sync session. Devices are
// not synced, so there is no sync_lookup or mobile migration to accompany this.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('devices', 'central_endpoint', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await query.addColumn('devices', 'central_endpoint_reported_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('devices', 'central_endpoint_reported_at');
  await query.removeColumn('devices', 'central_endpoint');
}
