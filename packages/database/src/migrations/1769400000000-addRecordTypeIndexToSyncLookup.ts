import { QueryInterface } from 'sequelize';

/**
 * Adds a critical index on record_type column to sync_lookup table.
 *
 * This index is essential for performance when filtering by record_type,
 * which is used in several migrations and queries. Without this index,
 * queries like "DELETE FROM sync_lookup WHERE record_type = '...'" require
 * full table scans on a 58M+ row table, causing migrations to take hours.
 *
 * The index is created with CONCURRENTLY to avoid locking the table during
 * creation, which is important for a production table of this size.
 */
export async function up(query: QueryInterface): Promise<void> {
  // Check if index already exists
  const [indexExists] = await query.sequelize.query<Array<{ exists: boolean }>>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'sync_lookup'
      AND indexname = 'sync_lookup_record_type'
    ) as exists;
    `,
  );

  if (indexExists[0]?.exists) {
    // Index already exists, skip creation
    return;
  }

  // Create index CONCURRENTLY to avoid locking the table
  // Note: CONCURRENTLY cannot be run inside a transaction, but Sequelize
  // migrations typically run outside transactions for DDL operations
  await query.sequelize.query(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS sync_lookup_record_type
    ON sync_lookup (record_type);
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS sync_lookup_record_type;
  `);
}
