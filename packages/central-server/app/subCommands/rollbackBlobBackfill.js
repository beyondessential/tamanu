import { Command } from 'commander';

import { ReadSettings } from '@tamanu/settings';
import { BlobBackfill, BlobStore, REFERENCE_TABLES } from '@tamanu/database/blobStore';
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
  // Not `||`: an explicit 0 means run without pausing.
  const delayMs = delay === undefined ? DEFAULT_DELAY_MS : Number(delay);
  const log = createNamedLogger('rollbackBlobBackfill', { batchSize: batch, delay: delayMs });

  const { sequelize, models } = await initDatabase({ testMode: false });
  const settings = new ReadSettings(models);
  // Built here rather than taken from an application context: this runs as a
  // standalone command with no server started. Central is the authoritative
  // store, so there is nothing evictable and no evictCache hook.
  const backfill = new BlobBackfill({
    sequelize,
    blobStore: new BlobStore({
      root: await settings.get('blobStorage.root'),
      models,
      getFreeDiskReserveBytes: async () =>
        (await settings.get('blobStorage.freeDiskReserveGB')) * 1024 ** 3,
    }),
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
