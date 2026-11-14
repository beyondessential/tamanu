import { BlobBackfill } from '@tamanu/database/blobStore';
import { InsufficientStorageError } from '@tamanu/errors';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { log } from '../services/logging';
import { ScheduledTask } from './ScheduledTask';

// spec: BKFL
export class BlobBackfillTask extends ScheduledTask {
  getName() {
    return 'BlobBackfillTask';
  }

  constructor(context, overrideConfig = null) {
    const conf = { ...context.schedules?.blobBackfill, ...overrideConfig };
    super(conf.schedule, log, conf.jitterTime, conf.enabled);
    this.config = conf;
    this.sequelize = context.sequelize ?? context.store?.sequelize;
    // The server's own store: on a facility it carries the cache-eviction hook.
    this.blobStore = context.blobStore;
    // A facility only seeds its store for assets and leaves the rows for central's synced updates.
    this.ownsRows = global.serverInfo?.serverType === 'central';
    this.tables = this.ownsRows ? ['attachments', 'assets'] : ['assets'];
  }

  async countQueue() {
    // New writes carry only a hash, so once nothing remains the backfill is done for good.
    if (this.complete) return 0;
    const backfill = this.getBackfill();
    const { rows, changelogEntries } = await backfill.countRemaining();
    const remaining = Object.values(rows).reduce((total, count) => total + count, 0) + changelogEntries;
    if (remaining === 0) this.complete = true;
    return remaining;
  }

  getBackfill() {
    this.backfill ??= new BlobBackfill({
      sequelize: this.sequelize,
      blobStore: this.blobStore,
      tables: this.tables,
    });
    return this.backfill;
  }

  async run() {
    const { batchSize, batchSleepAsyncDurationInMilliseconds: sleepMs } = this.config;
    const backfill = this.getBackfill();

    try {
      for (const tableName of this.tables) {
        // Seeding leaves the rows in place, so it walks them by offset.
        let seeded = 0;
        await this.drain(`rows:${tableName}`, batchSize, sleepMs, async () => {
          if (this.ownsRows) return await backfill.moveReferenceRows(tableName, batchSize);
          const count = await backfill.seedReferenceRows(tableName, batchSize, seeded);
          seeded += count;
          return count;
        });
      }

      // A facility leaves attachment changelog entries inline: relocating them would pin blobs for
      // pushed-and-deleted rows in the cache forever.
      await this.drain('changelog', batchSize, sleepMs, () =>
        backfill.rewriteChangelogEntries(batchSize),
      );
    } catch (error) {
      if (error instanceof InsufficientStorageError) {
        // The store grows before the database gives space back, so a tight volume pauses the job.
        log.warn('BlobBackfillTask: paused, not enough free disk to admit more content', {
          message: error.message,
        });
        return;
      }
      throw error;
    }

    await this.reportCompletion(backfill);
  }

  async drain(unit, batchSize, sleepMs, doBatch) {
    let total = 0;
    for (;;) {
      const count = await doBatch();
      total += count;
      if (count < batchSize) break;
      if (sleepMs > 0) await sleepAsync(sleepMs);
    }
    if (total > 0) {
      log.info('BlobBackfillTask: moved content into the blob store', { unit, count: total });
    }
    return total;
  }

  async reportCompletion(backfill) {
    const { rows, changelogEntries } = await backfill.countRemaining();
    const remaining = Object.values(rows).reduce((total, count) => total + count, 0);
    if (remaining + changelogEntries > 0) {
      log.info('BlobBackfillTask: content still to move', { rows, changelogEntries });
      return;
    }

    // Every referenced hash must also resolve to content this server holds.
    const unbacked = await backfill.findUnbackedHashes();
    if (unbacked.length > 0) {
      log.warn('BlobBackfillTask: complete except for content this server does not hold', {
        count: unbacked.length,
      });
      return;
    }
    log.info('BlobBackfillTask: complete, no in-database blob content remains');
  }
}
