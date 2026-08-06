import { runFunctionInBatches } from '@tamanu/utils/runFunctionInBatches';

import type { ChangeLog } from 'models/ChangeLog';
import type { Models } from 'types/model';

const DEFAULT_INSERT_BATCH_SIZE = 1000;

/**
 * `logs.changes` records carry a full copy of the record in `record_data`. Keep batches small to
 * small to avoid building one enormous `INSERT` query in memory.
 */
export const insertChangelogRecords = async (
  models: Models,
  changelogRecords: ChangeLog[],
  batchSize = DEFAULT_INSERT_BATCH_SIZE,
) => {
  if (!changelogRecords.length) return;

  const { ChangeLog } = models;

  // Entries are immutable, so re-delivered records are skipped rather than merged
  await runFunctionInBatches(
    changelogRecords,
    batch =>
      ChangeLog.bulkCreate(
        batch.map(record => ({ ...record })),
        { ignoreDuplicates: true },
      ),
    batchSize,
  );
};
