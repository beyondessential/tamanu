export const SYNC_SESSION_DIRECTION = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
} as const;

export type SYNC_SESSION_DIRECTION =
  (typeof SYNC_SESSION_DIRECTION)[keyof typeof SYNC_SESSION_DIRECTION];

export const CURRENT_SYNC_TIME = 'currentSyncTick';
export const LAST_SUCCESSFUL_PUSH = 'lastSuccessfulSyncPush';
export const LAST_SUCCESSFUL_PULL = 'lastSuccessfulSyncPull';

// This default is duplicated in the central settings schema mobileSync.networkRetryBudget
export const DEFAULT_SYNC_NETWORK_RETRY_BUDGET_MS = 10 * 60 * 1000;
