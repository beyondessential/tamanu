import { shouldPush } from './directions';

export const initSyncClientModeHooks = models => {
  Object.values(models)
    .filter(model => model.syncClientMode && shouldPush(model))
    .forEach(model => {
      model.addHook('beforeSave', 'markForPush', record => {
        if (!record.changed || !record.changed('markedForPush') ) {
          record.markedForPush = true;
        }
      });
    });
};
