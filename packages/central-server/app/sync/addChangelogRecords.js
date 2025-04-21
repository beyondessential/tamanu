import { Op } from 'sequelize';

// After the regular sync snapshotting process is complete, we need to grab any changelog records
// that:
// - are associated with the records inside the snapshot; and
// - have an updated_at_sync_tick matching the range of lookup table ticks being synced; and
// - for record types in the list that we sync changelogs down to the facility for
// This avoids having to run any complex logic for filtering the correct changelog records to
// send to a facility, as the snapshot has already run the right logic across the raw records, so
// if a record is included there, we know the recent changelog entries should be included too.

const RECORD_TYPES_THAT_WE_SYNC_CHANGELOGS_FOR = ['PatientProgramRegistration']; // TODO: table name or model name?

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
  const minSourceTick = lookupTicks.at(0).sourceStartTick;
  const maxSourceTick = lookupTicks.at(-1).sourceStartTick;

  const changelogRecords = await sequelize.query(
    `
    SELECT * FROM changelog
    WHERE updated_at_sync_tick BETWEEN :minSourceTick AND :maxSourceTick
    AND record_type IN (:whiteListedRecordTypes)
    AND CONCAT(record_type, '-', record_id) IN (:recordTypesAndIds)
    `,
    {
      replacements: {
        minSourceTick,
        maxSourceTick,
        whiteListedRecordTypes: RECORD_TYPES_THAT_WE_SYNC_CHANGELOGS_FOR, // TODO: move this to a config
        recordTypesAndIds: snapshotRecords.map((r) => `${r.recordType}-${r.id}`),
      },
    },
  );

  // TODO: should we use lodash or a map here?
  // add the changelog records to each snapshot record
  snapshotRecords.forEach((r) => {
    r.changelogRecords = changelogRecords.filter(
      (c) => c.recordType === r.recordType && c.id === r.id,
    );
  });
  return snapshotRecords;
};
