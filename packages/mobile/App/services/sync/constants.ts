export const SYNC_SESSION_DIRECTION = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
} as const;

export type SYNC_SESSION_DIRECTION =
  (typeof SYNC_SESSION_DIRECTION)[keyof typeof SYNC_SESSION_DIRECTION];

export const CURRENT_SYNC_TIME = 'currentSyncTick';
export const LAST_SUCCESSFUL_PUSH = 'lastSuccessfulSyncPush';
export const LAST_SUCCESSFUL_PULL = 'lastSuccessfulSyncPull';

/**
 * How long a sync request that is safe to repeat keeps retrying after the central server becomes
 * unreachable, before the sync fails. Well within the central server's stale session cleanup, so
 * the session is still open once the connection comes back.
 */
export const SYNC_NETWORK_RETRY_BUDGET_MS = 10 * 60 * 1000;
