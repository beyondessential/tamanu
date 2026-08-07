import config from 'config';
import type { BulkCreateOptions, InferAttributes } from 'sequelize';

import { runFunctionInBatches } from '@tamanu/utils/runFunctionInBatches';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import type { ChangeLog } from 'models/ChangeLog';
import type { Models } from 'types/model';

const { pauseBetweenPersistedCacheBatchesInMilliseconds, persistedCacheBatchSize } = config.sync;

type ChangeLogAttributes = InferAttributes<ChangeLog>;

const bulkCreateOptions = {
  /** Entries are immutable, so re-delivered records are skipped rather than merged */
  ignoreDuplicates: true,
  returning: false,
} as const satisfies BulkCreateOptions<ChangeLogAttributes>;

/**
 * `logs.changes` records carry a full copy of the record in `record_data`. Keep batches small to
 * avoid building one enormous `INSERT` query in memory.
 */
export const insertChangelogRecords = async (
  models: Models,
  changelogRecords: ChangeLogAttributes[],
  batchSize = persistedCacheBatchSize,
) => {
  if (!changelogRecords.length) return;

  const { ChangeLog } = models;

  await runFunctionInBatches(
    changelogRecords,
    async (batch: ChangeLogAttributes[]) => {
      await ChangeLog.bulkCreate(batch, bulkCreateOptions);
      await sleepAsync(pauseBetweenPersistedCacheBatchesInMilliseconds);
      // Result of this `runFunctionInBatches` is unused anyway; let the `bulkCreate` results get
      // garbage collected.
      return [];
    },
    batchSize,
  );
};
