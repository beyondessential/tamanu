import { DataTypes, type QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('sync_sessions', 'snapshot_dropped_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
  await query.sequelize.query(`
    CREATE INDEX sync_sessions_pending_snapshot_cleanup_idx
      ON sync_sessions (completed_at)
      WHERE errors IS NOT NULL AND snapshot_dropped_at IS NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `DROP INDEX IF EXISTS sync_sessions_pending_snapshot_cleanup_idx;`,
  );
  await query.removeColumn('sync_sessions', 'snapshot_dropped_at');
}
