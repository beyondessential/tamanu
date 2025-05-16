export const SYNC_SESSION_DIRECTION = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
};

export const COLUMNS_EXCLUDED_FROM_SYNC = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
];

export const SYNC_LOOKUP_PENDING_UPDATE_FLAG = -1;

export const SYNC_TICK_FLAGS = {
  INCOMING_FROM_CENTRAL_SERVER: -1,
  LAST_UPDATED_ELSEWHERE: -999,
  LOOKUP_PENDING_UPDATE: -2,
  OVERWRITE_WITH_CURRENT_TICK: 0,
};