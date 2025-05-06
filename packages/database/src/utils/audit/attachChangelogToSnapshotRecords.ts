import type { ChangeLog } from 'models';
import { QueryTypes } from 'sequelize';
import type { Models } from 'types/model';
import type { SyncSnapshotAttributes, SyncSnapshotAttributesWithChangelog } from 'types/sync';

type QueryConfig = {
  minSourceTick: number;
  maxSourceTick?: number;
  tableWhitelist?: string[];
};

export const attachChangelogToSnapshotRecords = async (
  models: Models,
  snapshotRecords: SyncSnapshotAttributes[],
  { minSourceTick, maxSourceTick, tableWhitelist }: QueryConfig,
): Promise<SyncSnapshotAttributesWithChangelog[]> => {
  const relevantRecords = tableWhitelist
    ? snapshotRecords.filter(({ recordType }) => tableWhitelist.includes(recordType))
    : snapshotRecords;

  if (!relevantRecords.length) {
    return snapshotRecords;
  }

  const changelogRecords = await models.ChangeLog.sequelize.query(
    `
   SELECT * FROM logs.changes
    WHERE record_sync_tick >= :minSourceTick
    ${maxSourceTick ? 'AND record_sync_tick <= :maxSourceTick' : ''}
    ${tableWhitelist ? `AND table_name IN (:tableWhitelist)` : ''}
    AND (table_name || '-' || record_id) IN (:recordTypeAndIds)
    `,
    {
      model: models.ChangeLog,
      type: QueryTypes.SELECT,
      mapToModel: true,
      replacements: {
        minSourceTick,
        maxSourceTick,
        tableWhitelist,
        recordTypeAndIds: relevantRecords.map(({ recordType, recordId }) => `${recordType}-${recordId}`),
      },
    },
  );

  const changelogRecordsByRecordId = changelogRecords.reduce<Record<string, ChangeLog[]>>(
    (acc, changelogRecord) => {
      const id = `${changelogRecord.tableName}-${changelogRecord.recordId}`;
      (acc[id] = acc[id] || []).push(changelogRecord);
      return acc;
    },
    {},
  );

  snapshotRecords.forEach((snapshotRecord) => {
    const id = `${snapshotRecord.recordType}-${snapshotRecord.recordId}`;
    (snapshotRecord as SyncSnapshotAttributesWithChangelog).changelogRecords =
      changelogRecordsByRecordId[id] || [];
  });
  return snapshotRecords as SyncSnapshotAttributesWithChangelog[];
};
