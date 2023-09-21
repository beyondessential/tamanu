export const SYNC_SESSION_DIRECTION = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
};

export const CURRENT_SYNC_TIME_KEY = 'currentSyncTick';
export const LAST_SUCCESSFUL_PUSH = 'lastSuccessfulSyncPush';
export const LAST_SUCCESSFUL_PULL = 'lastSuccessfulSyncPull';

export const COLUMNS_EXCLUDED_FROM_SYNC = ['createdAt', 'updatedAt', 'updatedAtSyncTick'];
