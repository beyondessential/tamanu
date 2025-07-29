export const QUERY_BATCH_SIZE = 10000;

export const SYNC_SESSION_DIRECTION = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
} as const;

export type SYNC_SESSION_DIRECTION =
  (typeof SYNC_SESSION_DIRECTION)[keyof typeof SYNC_SESSION_DIRECTION];

export const CURRENT_SYNC_TIME = 'currentSyncTick';
export const LAST_SUCCESSFUL_PUSH = 'lastSuccessfulSyncPush';
export const LAST_SUCCESSFUL_PULL = 'lastSuccessfulSyncPull';
