import { QueryTypes, type Sequelize } from 'sequelize';

import type { SyncSnapshotAttributes } from 'types/sync';

type QueryConfig = {
  minSourceTick: number;
  maxSourceTick?: number;
  tableWhitelist?: string[];
};

// TODO use model on merge with other sync pr
export type ChangelogRecord = {
  [key: string]: any;
  record_id: string;
};

export type SyncSnapshotAttributesWithChangelog = SyncSnapshotAttributes & {
  changelogRecords?: ChangelogRecord[];
};

export const attachChangelogToSnapshotRecords = async (
  sequelize: Sequelize,
  snapshotRecords: SyncSnapshotAttributes[],
  { minSourceTick, maxSourceTick, tableWhitelist }: QueryConfig,
): Promise<SyncSnapshotAttributesWithChangelog[]> => {
  if (!snapshotRecords.length) {
    return snapshotRecords as SyncSnapshotAttributesWithChangelog[];
  }
  const changelogRecords = (await sequelize.query(
    `
    SELECT * FROM logs.changes
    WHERE updated_at_sync_tick > :minSourceTick
    ${maxSourceTick ? 'AND updated_at_sync_tick < :maxSourceTick' : ''}
    ${tableWhitelist ? `AND table_name IN (:tableWhitelist)` : ''}
    AND CONCAT(table_name, '-', record_id) IN (:recordTypeAndIds)
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        minSourceTick,
        maxSourceTick,
        tableWhitelist,
        recordTypeAndIds: snapshotRecords.map((r) => `${r.recordType}-${r.recordId}`),
      },
    },
  )) as ChangelogRecord[];

  const changelogRecordsByRecordId = changelogRecords.reduce<Record<string, ChangelogRecord[]>>(
    (acc, changelogRecord) => {
      (acc[changelogRecord.record_id] = acc[changelogRecord.record_id] || []).push(changelogRecord);
      return acc;
    },
    {},
  );

  snapshotRecords.forEach((snapshotRecord) => {
    (snapshotRecord as SyncSnapshotAttributesWithChangelog).changelogRecords =
      changelogRecordsByRecordId[snapshotRecord.recordId] || [];
  });
  return snapshotRecords as SyncSnapshotAttributesWithChangelog[];
};
