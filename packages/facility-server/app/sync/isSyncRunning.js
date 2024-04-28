import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';
import { FACILITY_SYNC_PG_ADVISORY_LOCK_ID } from './constants';

export const isSyncRunning = async sequelize => {
  const [rows] = await sequelize.query(
    'SELECT NOT(pg_try_advisory_xact_lock(:syncLockId)) AS sync_is_processing;',
    {
      replacements: { syncLockId: FACILITY_SYNC_PG_ADVISORY_LOCK_ID },
    },
  );
  return rows[0].sync_is_processing;
};

export const waitForCurrentSyncSessionToFinish = async sequelize => {
  while (await isSyncRunning(sequelize)) {
    await sleepAsync(500); // wait for half a second
  }

  return true;
};
