import Sequelize from 'sequelize';

const CURRENT_SYNC_TIME_KEY = 'currentSyncTime';

export async function up(query) {
  await query.bulkInsert('local_system_facts', [
    {
      id: Sequelize.fn('uuid_generate_v4'),
      created_at: new Date(),
      updated_at: new Date(),
      key: CURRENT_SYNC_TIME_KEY,
      value: '1',
    },
  ]);
}

export async function down(query) {
  await query.bulkDelete('local_system_facts', { key: CURRENT_SYNC_TIME_KEY });
}
