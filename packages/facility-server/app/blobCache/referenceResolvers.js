import { QueryTypes } from 'sequelize';

import { FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { SYNC_TICK_FLAGS } from '@tamanu/database/sync';

// Identifiers can't be bound, so they're validated and quoted.
function quoteIdentifier(identifier) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

// spec: CACHE
/**
 * The pusher's resolvers and the stranded-outbox sweep share this list: a table missing here has
 * its outbox blobs demoted as unreferenced.
 */
export const BLOB_REFERENCE_TABLES = [{ tableName: 'attachments', hashColumn: 'hash' }];

// spec: CACHE
export const UNREFERENCED_BLOB_CONDITION = BLOB_REFERENCE_TABLES.map(
  ({ tableName, hashColumn }) => {
    const table = quoteIdentifier(tableName);
    return `NOT EXISTS (
      SELECT 1 FROM ${table}
      WHERE ${table}.${quoteIdentifier(hashColumn)} = blobs.hash
        AND ${table}.deleted_at IS NULL
    )`;
  },
).join(' AND ');

// spec: CACHE
/**
 * Synced means arrived via sync, or a positive tick at or below the last push cursor. Flag ticks
 * (0, -1, -2) don't count.
 */
export function makeSyncedReferenceResolver({ tableName, hashColumn }) {
  const table = quoteIdentifier(tableName);
  const column = quoteIdentifier(hashColumn);
  return async (models, hashes) => {
    // An empty IN list is a syntax error in Postgres.
    if (hashes.length === 0) {
      return [];
    }
    // Read once and bound, rather than a correlated subquery per candidate row.
    const pushCursor = Number(
      (await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH)) ?? -1,
    );
    const rows = await models.Blob.sequelize.query(
      `
        SELECT DISTINCT ${column} AS hash
        FROM ${table}
        WHERE ${column} IN (:hashes)
          AND (
            updated_at_sync_tick = :lastUpdatedElsewhere
            OR (updated_at_sync_tick > 0 AND updated_at_sync_tick <= :pushCursor)
          )
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          hashes,
          lastUpdatedElsewhere: SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE,
          pushCursor,
        },
      },
    );
    return rows.map(row => row.hash);
  };
}
