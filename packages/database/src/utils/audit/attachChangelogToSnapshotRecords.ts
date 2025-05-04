import type { ChangeLog } from 'models';
import sequelize, { Op } from 'sequelize';
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

  const recordTypeAndIds = relevantRecords.map(
    ({ recordType, recordId }) => `${recordType}-${recordId}`,
  );

  const changelogRecords = await models.ChangeLog.findAll({
    where: {
      [Op.and]: [
        {  recordSyncTick: {
          [Op.gt]: minSourceTick,
          ...(maxSourceTick && { [Op.lt]: maxSourceTick }),
        },
        ...(tableWhitelist && {
          tableName: {
            [Op.in]: tableWhitelist,
            },
          }),
        },
        sequelize.literal(`CONCAT("tableName", '-', "recordId") IN (:recordTypeAndIds)`),
      ],
      replacements: {
        recordTypeAndIds,
      },
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
