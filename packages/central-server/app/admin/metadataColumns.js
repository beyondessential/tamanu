/**
 * Metadata columns that are managed by the system and must not be imported from files.
 * Used by the exporter (to hide from export) and importer (to strip from incoming values).
 */
export const METADATA_COLUMNS = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
  'updatedAtByField',
];
