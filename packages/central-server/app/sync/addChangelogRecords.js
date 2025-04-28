import { Op } from 'sequelize';

import { attachChangelogToSnapshotRecords } from '@tamanu/database/utils/audit';

// After the regular sync snapshotting process is complete, we need to grab any changelog records
// that:
// - are associated with the records inside the snapshot; and
// - have an updated_at_sync_tick matching the range of lookup table ticks being synced; and
// - for record types in the list that we sync changelogs down to the facility for
// This avoids having to run any complex logic for filtering the correct changelog records to
// send to a facility, as the snapshot has already run the right logic across the raw records, so
// if a record is included there, we know the recent changelog entries should be included too.

const SYNC_CHANGELOG_TO_FACILITY_FOR_THESE_TABLES = ['patient_program_registrations'];

export const addChangelogRecords = async (models, pullSince, pullUntil, snapshotRecords) => {
  const { SyncLookupTick } = models;
  const { sequelize } = SyncLookupTick;

  // find the range of source sync ticks matching the lookup table ticks being synced
  const lookupTicks = await models.SyncLookupTick.findAll({
    where: {
      lookupEndTick: {
        [Op.between]: [pullSince, pullUntil],
      },
    },
    order: [['lookupEndTick', 'ASC']],
  });

  if (!lookupTicks.length) {
    return snapshotRecords;
  }

  const snapshotRecordsWithChangelogRecords = await attachChangelogToSnapshotRecords(sequelize, snapshotRecords, {
    minSourceTick: lookupTicks.at(0).sourceStartTick,
    maxSourceTick: lookupTicks.at(-1).sourceStartTick,
    tableNameWhitelist: SYNC_CHANGELOG_TO_FACILITY_FOR_THESE_TABLES,
  });

  return snapshotRecordsWithChangelogRecords;

};
