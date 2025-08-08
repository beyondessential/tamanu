import type { ChangeLog } from 'models';
import { QueryTypes, type Sequelize } from 'sequelize';

import { runFunctionInBatches } from '@tamanu/utils/runFunctionInBatches';

import type { Models } from 'types/model';
import type { SyncSnapshotAttributes, SyncSnapshotAttributesWithChangelog } from 'types/sync';

type QueryConfig = {
  minSourceTick: number;
  maxSourceTick?: number;
};

export const attachChangelogToSnapshotRecords = async (
  { models, sequelize }: { models: Models; sequelize: Sequelize },
  snapshotRecords: SyncSnapshotAttributes[],
  { minSourceTick, maxSourceTick }: QueryConfig,
): Promise<SyncSnapshotAttributesWithChangelog[]> => {
  if (!snapshotRecords.length) {
    return snapshotRecords;
  }

  const changelogRecords = await runFunctionInBatches(
    snapshotRecords,
    async (snapshotRecordBatch: SyncSnapshotAttributes[]) =>
      sequelize.query(
        `
          SELECT * FROM logs.changes
          WHERE updated_at_sync_tick >= ?
          ${maxSourceTick ? 'AND updated_at_sync_tick <= ?' : ''}
          AND (table_name, record_id) IN (VALUES ${snapshotRecordBatch.map(() => `(?, ?)`).join(',')});
        `,
        {
          model: models.ChangeLog,
          type: QueryTypes.SELECT,
          mapToModel: true,
          replacements: [
            minSourceTick,
            ...(maxSourceTick ? [maxSourceTick] : []),
            ...snapshotRecordBatch.map(({ recordType, recordId }) => [recordType, recordId]).flat(),
          ],
        },
      ),
  );

  const changelogRecordsByRecordId = changelogRecords.reduce<Record<string, ChangeLog[]>>(
    (acc, changelogRecord) => {
      const id = `${changelogRecord.tableName}-${changelogRecord.recordId}`;
      (acc[id] = acc[id] || []).push(changelogRecord);
      return acc;
    },
    {},
  );

  snapshotRecords.forEach(snapshotRecord => {
    const id = `${snapshotRecord.recordType}-${snapshotRecord.recordId}`;
    (snapshotRecord as SyncSnapshotAttributesWithChangelog).changelogRecords =
      changelogRecordsByRecordId[id] || [];
  });
  return snapshotRecords as SyncSnapshotAttributesWithChangelog[];
};
