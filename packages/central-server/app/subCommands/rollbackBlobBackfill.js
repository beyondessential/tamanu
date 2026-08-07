import { Command } from 'commander';

import { ReadSettings } from '@tamanu/settings';
import { BlobBackfill, REFERENCE_TABLES, createBlobStore } from '@tamanu/database/blobStore';
import { createNamedLogger } from '@tamanu/shared/services/logging/createNamedLogger';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { initDatabase } from '../database';

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_DELAY_MS = 1000;

// spec: BKFL
// Reverses the backfill by re-inflating the database from the blob store. The
// store keeps every byte it was given, so this works at any stage — mid-run as
// well as complete — but it needs the store intact: it restores from the store,
// not from a backup.
export const rollbackBlobBackfill = async ({ batchSize, delay }) => {
  const batch = Number(batchSize) || DEFAULT_BATCH_SIZE;
  const delayMs = Number(delay) ?? DEFAULT_DELAY_MS;
  const log = createNamedLogger('rollbackBlobBackfill', { batchSize: batch, delay: delayMs });

  const { sequelize, models } = await initDatabase({ testMode: false });
  const settings = new ReadSettings(models);
  const backfill = new BlobBackfill({
    sequelize,
    blobStore: await createBlobStore({ models, settings }),
  });

  const drain = async (unit, doBatch) => {
    let total = 0;
    for (;;) {
      const count = await doBatch();
      total += count;
      if (count > 0) log.info('Restored to the database', { unit, count, total });
      if (count < batch) break;
      if (delayMs > 0) await sleepAsync(delayMs);
    }
    return total;
  };

  log.info('Started blob backfill rollback');
  for (const tableName of REFERENCE_TABLES) {
    await drain(`rows:${tableName}`, () => backfill.rollbackReferenceRows(tableName, batch));
  }
  await drain('changelog', () => backfill.rollbackChangelogEntries(batch));
  log.info('Completed blob backfill rollback');
};

export const rollbackBlobBackfillCommand = new Command('rollbackBlobBackfill')
  .description('Move blob content back into the database from the blob store, reversing the backfill')
  .option('-b, --batchSize <number>', 'Rows to restore per batch')
  .option('-d, --delay <ms>', 'Delay in milliseconds between each batch')
  .action(async options => {
    try {
      await rollbackBlobBackfill(options);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });
