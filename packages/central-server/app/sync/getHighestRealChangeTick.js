import { QueryTypes } from 'sequelize';

// spec: SYNCHK#highest-real-change-tick
//
// The highest settled sync tick in the lookup table, or null when it holds none.
//
// Ticks of 0 or below are stubs or SYNC_TICK_FLAGS, never real changes; a null data column marks a
// stub whatever its tick.
//
// A backward walk of the updated_at_sync_tick index, so it does not scan the table.
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
