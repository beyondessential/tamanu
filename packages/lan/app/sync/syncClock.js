export async function getSyncClockTime(sequelize) {
  const [[{ last_value: currentTick }]] = await sequelize.query(
    `SELECT last_value FROM sync_clock_sequence;`,
  );
  return currentTick;
}

export async function setSyncClockTime(sequelize, currentSyncTick) {
  await sequelize.query(`SELECT setval('sync_clock_sequence', :currentSyncTick)`, {
    replacements: { currentSyncTick },
  });
}
