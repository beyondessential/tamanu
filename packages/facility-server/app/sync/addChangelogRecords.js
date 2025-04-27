import { QueryTypes } from "sequelize";

// TODO attach changelog records to snapshot records as changelogRecords property
export const addChangelogRecords = async (sequelize, since, snapshotRecords) => {
  const changelogRecords = await sequelize.query(
    `
    SELECT * FROM logs.changes
    WHERE updated_at_sync_tick > :since
    AND CONCAT(table_name, '-', record_id) IN (:recordTypeAndIds)
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        since,
        recordTypeAndIds: snapshotRecords.map((r) => `${r.recordType}-${r.recordId}`),
      },
    },
  );

  if (!changelogRecords.length) {
    return snapshotRecords;
  }

  // Group changelog records by record_id in a single pass
  const changelogRecordsByRecordId = changelogRecords.reduce((acc, c) => {
    (acc[c.record_id] = acc[c.record_id] || []).push(c);
    return acc;
  }, {});

  // Assign changelog records to snapshot records in a single pass
  snapshotRecords.forEach(r => r.changelogRecords = changelogRecordsByRecordId[r.recordId] || []);
  return snapshotRecords;
};
