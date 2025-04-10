import { FACT_SYNC_TRIGGER_CONTROL } from '@tamanu/constants/facts';

export { DataMigration } from './DataMigration';
export { CursorDataMigration } from './CursorDataMigration';

/*
 * No query done in `callback` trigger the sync tick update.
 * It's recommended to wrap this in a transaction.
 * Otherwise, the trigger kept disabled when the callback throws an error.
 */
export const disableSyncTrigger = async (sequelize, callback) => {
  const { LocalSystemFact } = sequelize.models;
  await LocalSystemFact.set(FACT_SYNC_TRIGGER_CONTROL, 'disabled');
  await callback();
  await LocalSystemFact.set(FACT_SYNC_TRIGGER_CONTROL, 'enabled');
};

export const isSyncTriggerDisabled = async (sequelize) => {
  const state = await sequelize.models.LocalSystemFact.get(FACT_SYNC_TRIGGER_CONTROL);
  return state === 'disabled';
};
