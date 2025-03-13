export {
  FACT_CURRENT_SYNC_TICK,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
  FACT_LAST_SUCCESSFUL_SYNC_PUSH,
  FACT_LOOKUP_UP_TO_TICK,
} from '@tamanu/constants/facts';

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
