import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_session_records', 'saved_at_sync_tick', { type: DataTypes.BIGINT });
}

export async function down(query) {
  await query.removeColumn('sync_session_records', 'saved_at_sync_tick');
}
