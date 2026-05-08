import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_sessions', 'snapshot_started_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('sync_sessions', 'snapshot_started_at');
}
