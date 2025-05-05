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

export const SYNC_CHANGELOG_TO_FACILITY_FOR_THESE_TABLES = ['patient_program_registrations'];