export async function setSyncClockTime(sequelize, currentSyncTick) {
  await sequelize.query(`SELECT setval('sync_clock_sequence', :currentSyncTick)`, {
    replacements: { currentSyncTick },
  });
}
