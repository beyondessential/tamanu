import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';

export const isSyncRunning = async sequelize => {
  const [rows] = await sequelize.query(
    'SELECT NOT(pg_try_advisory_xact_lock(1)) AS sync_is_processing;',
    {},
  );
  return rows[0].sync_is_processing;
};

export const waitForCurrentSyncSessionToFinish = async sequelize => {
  while (await isSyncRunning(sequelize)) {
    await sleepAsync(500); // wait for half a second
  }

  return true;
};
