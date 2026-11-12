/**
 * The incremental-sync snapshot is staged in its own throwaway SQLite file, attached to the main
 * connection under this schema name, rather than in the main `tamanu` file. That keeps the
 * per-page staging writes out of the main file’s journal (the snapshot file runs with no journal
 * and no fsync), and dropping the staged data shrinks the file instead of leaving free pages
 * behind in the main database forever.
 */
export const SNAPSHOT_DB_NAME = 'tamanu-sync-snapshot';
export const SNAPSHOT_SCHEMA = 'snapshot';
export const SNAPSHOT_TABLE = `${SNAPSHOT_SCHEMA}.sync_snapshot`;
