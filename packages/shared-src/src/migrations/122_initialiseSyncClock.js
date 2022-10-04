import Sequelize from 'sequelize';

const CURRENT_SYNC_TIME_KEY = 'currentSyncTime';

export async function up(query) {
  await query.bulkInsert('local_system_facts', [
    { id: Sequelize.fn('uuid_generate_v4'), key: CURRENT_SYNC_TIME_KEY, value: '0' },
  ]);
}

export async function down(query) {
  await query.bulkDelete('local_system_facts', { key: CURRENT_SYNC_TIME_KEY });
}
