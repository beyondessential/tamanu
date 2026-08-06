import { QueryTypes } from 'sequelize';

import { FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { SYNC_TICK_FLAGS } from '@tamanu/database/sync';

// Table and column names cannot be bound as query parameters, so they are
// interpolated. Consumers pass code literals, never user input; this still
// validates the shape and double-quotes, so a malformed identifier fails loudly
// rather than reaching the database.
function quoteIdentifier(identifier) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

// spec: CACHE
/**
 * Builds a reference resolver for a consumer table that references blobs by
 * hash: given candidate hashes, returns those with at least one referencing
 * record that has synchronised to the central server. Synchronised is
 * determined from the server's own sync progress: the record either arrived
 * via sync (last updated elsewhere) or was included in a completed push (a
 * real, positive sync tick at or below the last successful push cursor). Flag
 * ticks (0, -1, -2) are not treated as pushed.
 *
 * Consumers append their resolver to `context.blobReferenceResolvers` at
 * startup, e.g. attachments: `makeSyncedReferenceResolver({ tableName:
 * 'attachments', hashColumn: 'hash' })`. Table and column names are code
 * literals, never user input.
 */
export function makeSyncedReferenceResolver({ tableName, hashColumn }) {
  const table = quoteIdentifier(tableName);
  const column = quoteIdentifier(hashColumn);
  return async (models, hashes) => {
    // An empty IN list is a syntax error in Postgres; nothing is eligible anyway.
    if (hashes.length === 0) {
      return [];
    }
    // The push cursor is a single scalar that changes at most once per sync
    // cycle. Read it once and bind it, rather than a correlated subquery
    // re-evaluated against local_system_facts for every candidate row.
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
