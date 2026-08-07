import config from 'config';
import { runFunctionInBatches } from '@tamanu/utils/runFunctionInBatches';

import type { ChangeLog } from 'models/ChangeLog';
import type { Models } from 'types/model';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

const { pauseBetweenPersistedCacheBatchesInMilliseconds, persistedCacheBatchSize } = config.sync;

/**
 * `logs.changes` records carry a full copy of the record in `record_data`. Keep batches small to
 * small to avoid building one enormous `INSERT` query in memory.
 */
export const insertChangelogRecords = async (
  models: Models,
  changelogRecords: ChangeLog[],
  batchSize = persistedCacheBatchSize,
) => {
  if (!changelogRecords.length) return;

  const { ChangeLog } = models;

  // Entries are immutable, so re-delivered records are skipped rather than merged
  await runFunctionInBatches(
    changelogRecords,
    async batch => {
      await sleepAsync(pauseBetweenPersistedCacheBatchesInMilliseconds);
      return ChangeLog.bulkCreate(
        batch.map(record => ({ ...record })),
        { ignoreDuplicates: true },
      );
    },
    batchSize,
  );
};
