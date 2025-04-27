import { QueryTypes, type Sequelize } from 'sequelize';

type QueryConfig = {
  minSourceTick: number;
  maxSourceTick?: number;
  safeListedTableNames?: string[];
};

export const attachChangelogRecordsToSnapshot = async (
  sequelize: Sequelize,
  snapshotRecords: any[],
  { minSourceTick, maxSourceTick, safeListedTableNames }: QueryConfig,
) => {
  const changelogRecords = (await sequelize.query(
    `
    SELECT * FROM logs.changes
    WHERE updated_at_sync_tick > :minSourceTick
    AND CONCAT(table_name, '-', record_id) IN (:recordTypeAndIds)
    ${maxSourceTick ? 'AND updated_at_sync_tick < :maxSourceTick' : ''}
    ${safeListedTableNames ? `AND table_name IN (:safeListedTableNames)` : ''}
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        minSourceTick,
        maxSourceTick,
        safeListedTableNames,
        recordTypeAndIds: snapshotRecords.map((r) => `${r.recordType}-${r.recordId}`),
      },
    },
  )) as any[];

  if (!changelogRecords.length) {
    return snapshotRecords;
  }

  const changelogRecordsByRecordId = changelogRecords.reduce((acc, changelogRecord) => {
    (acc[changelogRecord.record_id] = acc[changelogRecord.record_id] || []).push(changelogRecord);
    return acc;
  }, {});

  snapshotRecords.forEach((snapshotRecord) => {
    snapshotRecord.changelogRecords = changelogRecordsByRecordId[snapshotRecord.recordId] || [];
  });
  return snapshotRecords;
};
