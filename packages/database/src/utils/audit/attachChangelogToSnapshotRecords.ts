import type { ChangeLog } from 'models';
import { Op, Sequelize } from 'sequelize';
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

  const tableNameAndRecordIdsString = relevantRecords.map(({ recordType, recordId }) => `${recordType}-${recordId}`);

  const changelogRecords: ChangeLog[] = await models.ChangeLog.findAll({
    where: {
      recordSyncTick: {
        [Op.gte]: minSourceTick,
        ...(maxSourceTick && { [Op.lte]: maxSourceTick }),
      },
      ...(tableWhitelist && {
        tableName: {
          [Op.in]: tableWhitelist,
        },
      }),
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn('concat', Sequelize.col('table_name'), '-', Sequelize.col('record_id')),
          { [Op.in]: tableNameAndRecordIdsString }
        )
      ],
    },
  });

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
