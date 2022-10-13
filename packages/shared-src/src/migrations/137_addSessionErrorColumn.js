import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_sessions', 'error', { type: DataTypes.STRING });
}

export async function down(query) {
  await query.removeColumn('sync_sessions', 'error');
}
