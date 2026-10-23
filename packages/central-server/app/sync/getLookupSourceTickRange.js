import { Op } from 'sequelize';

// After the regular sync snapshotting process is complete, we need to grab any changelog records
// that have an updated_at_sync_tick matching the range of lookup table source ticks being synced.
// This avoids having to run any complex logic for filtering the correct changelog records to
// send to a facility, as the snapshot has already run the right logic across the raw records, so
// if a record is included there, we know the recent changelog entries should be included too.
//
// Only the first and last lookup ticks in the range are needed, so fetch just those two rows:
// an initial sync (pullSince -1) spans the whole of sync_lookup_ticks, which grows by one row per
// lookup update and can be large enough that loading it all exhausts the heap.

export const getLookupSourceTickRange = async ({ models }, pullSince, pullUntil) => {
  const { SyncLookupTick } = models;
  const where = {
    lookupEndTick: {
      [Op.gt]: pullSince,
      [Op.lt]: pullUntil,
    },
  };

  const firstLookupTick = await SyncLookupTick.findOne({
    where,
    order: [['lookupEndTick', 'ASC']],
  });
  if (!firstLookupTick) {
    return {};
  }

  const lastLookupTick = await SyncLookupTick.findOne({
    where,
    order: [['lookupEndTick', 'DESC']],
  });

  return {
    minSourceTick: firstLookupTick.sourceStartTick,
    maxSourceTick: lastLookupTick.lookupEndTick,
  };
};
