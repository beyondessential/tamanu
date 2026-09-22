import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'blobs', schema: 'public' };

// spec: CACHE
// The facility outbox-and-cache dimensions of the blob registry: which tier a
// blob is in (outbox: only durable copy, never evicted; cache: durable on
// central, evictable), its recency for LRU eviction, and the sync tick at which
// it first became eligible for push (the outbox dysfunction measure, compared
// against sync progress; see specs/blob-storage/capacity.md). Admission sets the
// initial recency via the column default.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'tier', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'cache',
  });
  await query.addColumn(TABLE, 'last_accessed_at', {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: query.sequelize.literal('now()'),
  });
  await query.addColumn(TABLE, 'eligible_since_tick', {
    // Null until the blob is first observed eligible for push (its referencing
    // record has synced); then the push cursor at that moment. Compared against
    // the current push cursor to measure how long it has gone unpushed while
    // syncs kept succeeding.
    type: DataTypes.BIGINT,
    allowNull: true,
  });
  // Serves both the LRU eviction scan (tier = cache, oldest access first) and
  // the pusher's oldest-first outbox drain.
  await query.addIndex(TABLE, ['tier', 'last_accessed_at'], {
    name: 'blobs_tier_last_accessed_at',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(TABLE, 'blobs_tier_last_accessed_at');
  await query.removeColumn(TABLE, 'eligible_since_tick');
  await query.removeColumn(TABLE, 'last_accessed_at');
  await query.removeColumn(TABLE, 'tier');
}
