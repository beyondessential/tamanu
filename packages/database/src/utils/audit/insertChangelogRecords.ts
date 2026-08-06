import type { InferAttributes } from 'sequelize';

import { runFunctionInBatches } from '@tamanu/utils/runFunctionInBatches';

import type { ChangeLog } from 'models/ChangeLog';
import type { Models } from 'types/model';

const DEFAULT_INSERT_BATCH_SIZE = 1000;

type ChangeLogAttributes = InferAttributes<ChangeLog>;

/**
 * `logs.changes` records carry a full copy of the record in `record_data`. Keep batches small to
 * avoid building one enormous `INSERT` query in memory.
 */
export const insertChangelogRecords = async (
  models: Models,
  changelogRecords: ChangeLogAttributes[],
  batchSize = DEFAULT_INSERT_BATCH_SIZE,
) => {
  if (!changelogRecords.length) return;

  const { ChangeLog } = models;

  // Entries are immutable, so re-delivered records are skipped rather than merged.
  await runFunctionInBatches(
    changelogRecords,
    (batch: ChangeLogAttributes[]) => ChangeLog.bulkCreate(batch, { ignoreDuplicates: true }),
    batchSize,
  );
};
