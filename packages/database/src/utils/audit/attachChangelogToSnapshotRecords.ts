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
          AND (table_name, record_id) IN (VALUES ${snapshotRecordBatch.map(() => '(?, ?)').join(',')});
        `,
        {
          model: models.ChangeLog,
          type: QueryTypes.SELECT,
          mapToModel: true,
          replacements: [
            minSourceTick,
            ...(maxSourceTick ? [maxSourceTick] : []),
            ...snapshotRecordBatch.flatMap(({ recordType, recordId }) => [recordType, recordId]),
          ],
        },
      ),
  );

  const changelogRecordsByRecordId: Record<string, ChangeLog[]> = {};
  for (const changelogRecord of changelogRecords) {
    const id = `${changelogRecord.tableName}-${changelogRecord.recordId}`;
    changelogRecordsByRecordId[id] ??= [];
    changelogRecordsByRecordId[id].push(changelogRecord);
  }

  for (const snapshotRecord of snapshotRecords as SyncSnapshotAttributesWithChangelog[]) {
    const id = `${snapshotRecord.recordType}-${snapshotRecord.recordId}`;
    snapshotRecord.changelogRecords = changelogRecordsByRecordId[id] ?? [];
  }
  return snapshotRecords as SyncSnapshotAttributesWithChangelog[];
};
