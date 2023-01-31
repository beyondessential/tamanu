export const QUERY_BATCH_SIZE = 10000;

export enum SYNC_SESSION_DIRECTION {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export const CURRENT_SYNC_TIME = 'currentSyncTick';
export const LAST_SUCCESSFUL_PUSH = 'lastSuccessfulSyncPush';
export const LAST_SUCCESSFUL_PULL = 'lastSuccessfulSyncPull';
