import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'blobs', schema: 'public' };

// spec: CACHE
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
    // Null until first eligible for push.
    type: DataTypes.BIGINT,
    allowNull: true,
  });
  // Serves both the LRU eviction scan and the pusher's oldest-first drain.
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
