import { Op } from 'sequelize';

// After the regular sync snapshotting process is complete, we need to grab any changelog records
// that have an updated_at_sync_tick matching the range of lookup table source ticks being synced.
// This avoids having to run any complex logic for filtering the correct changelog records to
// send to a facility, as the snapshot has already run the right logic across the raw records, so
// if a record is included there, we know the recent changelog entries should be included too.

export const getLookupSourceTickRange = async ({ models }, pullSince, pullUntil) => {
  const { SyncLookupTick } = models;
  const lookupTicks = await SyncLookupTick.findAll({
    where: {
      lookupEndTick: {
        [Op.gt]: pullSince,
        [Op.lt]: pullUntil,
      },
    },
    order: [['lookupEndTick', 'ASC']],
  });

  if (!lookupTicks.length) {
    return null;
  }

  const minSourceTick = lookupTicks.at(0).sourceStartTick;
  const maxSourceTick = lookupTicks.at(-1).lookupEndTick;

  return { minSourceTick, maxSourceTick };
};
