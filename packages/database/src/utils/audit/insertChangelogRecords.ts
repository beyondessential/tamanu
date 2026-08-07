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

  await runFunctionInBatches(
    changelogRecords,
    async batch => {
      await ChangeLog.bulkCreate(
        batch.map(record => ({ ...record })),
        // Entries are immutable, so re-delivered records are skipped rather than merged
        { ignoreDuplicates: true },
      );
      await sleepAsync(pauseBetweenPersistedCacheBatchesInMilliseconds);
      // Result of this `runFunctionInBatches` is unused anyway; let the `bulkCreate` results get
      // garbage collected. Returning empty array simply for type safety.
      return [];
    },
    batchSize,
  );
};
