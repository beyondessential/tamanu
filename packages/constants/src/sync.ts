export const SYNC_DIRECTIONS = {
  DO_NOT_SYNC: 'do_not_sync', // Important! Non-syncing tables should also be added to shared/src/services/migrations/constants.js
  PUSH_TO_CENTRAL: 'push_to_central',
  PULL_FROM_CENTRAL: 'pull_from_central',
  BIDIRECTIONAL: 'bidirectional',
};

export const SYNC_DIRECTIONS_VALUES = Object.values(SYNC_DIRECTIONS);

export const SYNC_QUEUE_STATUSES = {
  QUEUED: 'queued',
  READY: 'ready',
};