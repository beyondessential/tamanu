import { QueryTypes } from 'sequelize';

// spec: SYNCHK#highest-real-change-tick
//
// The highest settled sync tick in the lookup table, or null when it holds none.
//
// Ticks of zero or below are never real: 0 is the placeholder a stub row carries until it is
// built, and the negative values are flags, including the one that marks rows a running build
// has written but not yet settled (SYNC_TICK_FLAGS). The data check is a second guard for stubs.
//
// Planned as a single backward step through the index on updated_at_sync_tick, so it does not
// scan the table. Stubs and flagged rows sort below every real tick, so they are not stepped
// over unless the table holds nothing real.
export const getHighestRealChangeTick = async models => {
  const [row] = await models.SyncLookup.sequelize.query(
    `
      SELECT updated_at_sync_tick AS tick
      FROM sync_lookup
      WHERE updated_at_sync_tick > 0
        AND data IS NOT NULL
      ORDER BY updated_at_sync_tick DESC
      LIMIT 1
    `,
    { type: QueryTypes.SELECT },
  );
  // bigint columns come back as strings
  return row ? Number(row.tick) : null;
};
