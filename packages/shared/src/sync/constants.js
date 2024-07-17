export const SYNC_SESSION_DIRECTION = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
};

export const CURRENT_SYNC_TIME_KEY = 'currentSyncTick';
export const LAST_SUCCESSFUL_SYNC_PULL_KEY = 'lastSuccessfulSyncPull';
export const LAST_SUCCESSFUL_SYNC_PUSH_KEY = 'lastSuccessfulSyncPush';
export const LAST_SUCCESSFUL_GLOBAL_SYNC_KEY = 'lastSuccessfulGlobalSync';

export const COLUMNS_EXCLUDED_FROM_SYNC = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
];
