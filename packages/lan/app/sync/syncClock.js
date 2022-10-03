const CURRENT_SYNC_TIME_KEY = 'currentSyncTime';

export async function getSyncClockTime(sequelize) {
  const [[{ last_value: currentTick }]] = await sequelize.query(
    `SELECT value FROM local_system_facts WHERE key = '${CURRENT_SYNC_TIME_KEY}';`,
  );
  return currentTick || 0;
}

export async function setSyncClockTime(sequelize, currentSyncTick) {
  await sequelize.query(
    `UPDATE local_system_facts SET value = :currentSyncTick WHERE key = '${CURRENT_SYNC_TIME_KEY}'`,
    {
      replacements: { currentSyncTick },
    },
  );
}
