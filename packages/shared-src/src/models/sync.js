import { SYNC_DIRECTIONS } from 'shared/constants';

export const shouldPull = model =>
  model.syncDirection === SYNC_DIRECTIONS.PULL_ONLY ||
  model.syncDirection === SYNC_DIRECTIONS.BIDIRECTIONAL;

export const shouldPush = model =>
  model.syncDirection === SYNC_DIRECTIONS.PUSH_ONLY ||
  model.syncDirection === SYNC_DIRECTIONS.BIDIRECTIONAL;

export const initSyncClientModeHooks = models => {
  Object.values(models).filter(model => shouldPush(model)).forEach(model => {
    model.addHook('beforeSave', 'markForPush', record => {
      if (!record.changed || !record.changed('markedForPush') ) {
        record.markedForPush = true;
      }
    });
  });
};
