export async function up(query) {
  await query.addIndex('sync_sessions', ['completed_at'], {
    name: 'sync_sessions_completed_at_idx',
  });
}

export async function down(query) {
  await query.removeIndex('sync_sessions', 'sync_sessions_completed_at_idx');
}
