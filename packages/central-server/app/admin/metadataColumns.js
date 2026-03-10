/**
 * Metadata columns that are managed by the system and must not be imported from files.
 * Used by the exporter (to hide from export) and importer (to reject files containing them).
 */
export const METADATA_COLUMNS = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
  'updatedAtByField',
];
