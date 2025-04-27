import { Op, QueryTypes } from 'sequelize';

// After the regular sync snapshotting process is complete, we need to grab any changelog records
// that:
// - are associated with the records inside the snapshot; and
// - have an updated_at_sync_tick matching the range of lookup table ticks being synced; and
// - for record types in the list that we sync changelogs down to the facility for
// This avoids having to run any complex logic for filtering the correct changelog records to
// send to a facility, as the snapshot has already run the right logic across the raw records, so
// if a record is included there, we know the recent changelog entries should be included too.

const TABLES_TO_SYNC_CHANGELOGS = ['patient_program_registrations'];

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
      SELECT * FROM logs.changes
      WHERE updated_at_sync_tick > :minSourceTick AND updated_at_sync_tick < :maxSourceTick
      AND table_name IN (:whiteListedTableNames)
      AND CONCAT(table_name, '-', record_id) IN (:recordTypeAndIds)
      `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        minSourceTick,
        maxSourceTick,
        whiteListedTableNames: TABLES_TO_SYNC_CHANGELOGS, // TODO: move this to a config
        recordTypeAndIds: snapshotRecords.map((r) => `${r.recordType}-${r.recordId}`),
      },
    },
  );

  if (!changelogRecords.length) {
    return snapshotRecords;
  }

  const changelogRecordsByRecordId = changelogRecords.reduce((acc, c) => {
    (acc[c.record_id] = acc[c.record_id] || []).push(c);
    return acc;
  }, {});

  snapshotRecords.forEach((r) => {
    r.changelogRecords = changelogRecordsByRecordId[r.recordId] || [];
  });

  return snapshotRecords;
};
