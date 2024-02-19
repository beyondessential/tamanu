export { DataMigration } from './DataMigration';
export { CursorDataMigration } from './CursorDataMigration';

/*
 * No query done in `callback` trigger the sync tick update.
 * It's recommended to wrap this in a transaction.
 * Otherwise, the trigger kept disabled when the callback throws an error.
 */
export const disableSyncTrigger = async (sequelize, callback) => {
    const { LocalSystemFact } = sequelize.models;
    await LocalSystemFact.set('syncTrigger', 'disabled');
    await callback();
    await LocalSystemFact.set('syncTrigger', 'enabled');
};
