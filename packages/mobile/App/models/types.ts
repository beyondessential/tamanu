export const SYNC_DIRECTIONS = {
  DO_NOT_SYNC: 'do_not_sync',
  PUSH_TO_CENTRAL: 'push_to_central',
  PULL_FROM_CENTRAL: 'pull_from_central',
  BIDIRECTIONAL: 'bidirectional',
} as const;

export type SYNC_DIRECTIONS = (typeof SYNC_DIRECTIONS)[keyof typeof SYNC_DIRECTIONS];
