export const SYNC_DIRECTIONS = {
  DO_NOT_SYNC: 'do_not_sync', // Important! Non-syncing tables should also be added to shared/src/services/migrations/constants.js
  PUSH_TO_CENTRAL: 'push_to_central',
  PUSH_TO_CENTRAL_THEN_DELETE: 'push_to_central_then_delete', // No local copy required after sync
  PULL_FROM_CENTRAL: 'pull_from_central',
  BIDIRECTIONAL: 'bidirectional',
};

export const SYNC_DIRECTIONS_VALUES = Object.values(SYNC_DIRECTIONS);

export const SYNC_STREAM_MESSAGE_KIND = {
  SESSION_WAITING: 'SESSION_WAITING',
  PULL_WAITING: 'PULL_WAITING',
  PULL_CHANGE: 'PULL_CHANGE',
  END: 'END',
};
