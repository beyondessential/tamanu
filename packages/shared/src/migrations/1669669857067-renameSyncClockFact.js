export async function up(query) {
  await query.sequelize.query(`
    UPDATE local_system_facts
    SET key = 'currentSyncTick'
    WHERE key = 'currentSyncTime'
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    UPDATE local_system_facts
    SET key = 'currentSyncTime'
    WHERE key = 'currentSyncTick'
  `);
}
