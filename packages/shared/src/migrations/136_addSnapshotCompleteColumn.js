import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_sessions', 'snapshot_completed_at', { type: DataTypes.DATE });
}

export async function down(query) {
  await query.removeColumn('sync_sessions', 'snapshot_completed_at');
}
