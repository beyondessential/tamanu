const CURRENT_SYNC_TIME_KEY = 'currentSyncTime';

export async function up(query) {
  await query.bulkInsert('local_system_facts', [{ key: CURRENT_SYNC_TIME_KEY, value: '0' }]);
}

export async function down(query) {
  await query.bulkDelete('local_system_facts', { key: CURRENT_SYNC_TIME_KEY });
}
