
import { NOTIFY_CHANNELS } from '@tamanu/constants';
import { refreshChildRecordsForSync } from '@tamanu/shared/utils/refreshChildRecordsForSync';

/**
 * Register a listener when a record is updated and the change includes patient_id
 * @param {*} models
 * @param {*} dbNotifier
 */
export const registerSyncLookupUpdateListener = async (models, dbNotifier) => {
  const onTableChanged = dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED];
  onTableChanged(async payload => {
    if (payload.event === 'UPDATE' && payload.changedColumns?.includes('patient_id')) {
      const model = Object.values(models).find(model => model.tableName === payload.table);
      await refreshChildRecordsForSync(model, payload.newId);
    }
  });
};
