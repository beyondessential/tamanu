import { BlobBackfill } from '@tamanu/database/blobStore';
import { InsufficientStorageError } from '@tamanu/errors';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { log } from '../services/logging';
import { ScheduledTask } from './ScheduledTask';

// spec: BKFL
// Moves legacy in-database attachment and asset content into the blob store,
// a batch at a time with a pause between, until nothing is left to move. Runs
// from server start with no operator action and no-ops once complete, which is
// also what makes it resumable: each run rediscovers its work from the data.
export class BlobBackfillTask extends ScheduledTask {
  getName() {
    return 'BlobBackfillTask';
  }

  constructor(context, overrideConfig = null) {
    const conf = { ...context.schedules?.blobBackfill, ...overrideConfig };
    super(conf.schedule, log, conf.jitterTime, conf.enabled);
    this.config = conf;
    this.sequelize = context.sequelize ?? context.store?.sequelize;
    // The server's own store, not one of this task's making: on a facility it
    // carries the cache-eviction hook, so a backfill admission that runs the
    // volume down to the reserve evicts cache instead of refusing.
    this.blobStore = context.blobStore;
    // Only central owns the rows: it holds the attachment and asset bytes and
    // rewrites the rows in place. A facility holds only pulled asset bytes, so
    // it seeds its store for assets and leaves the rows for central's synced
    // updates; its attachments push inline and are the outbox's concern.
    // `global.serverInfo.serverType` is set at boot in each server package.
    this.ownsRows = global.serverInfo?.serverType === 'central';
    this.tables = this.ownsRows ? ['attachments', 'assets'] : ['assets'];
  }

  async countQueue() {
    const backfill = this.getBackfill();
    const { rows, changelogEntries } = await backfill.countRemaining();
    return Object.values(rows).reduce((total, count) => total + count, 0) + changelogEntries;
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
        // Seeding leaves the rows in place, so it walks them by offset;
        // moving consumes them, so the same query keeps returning fresh work.
        let seeded = 0;
        await this.drain(`rows:${tableName}`, batchSize, sleepMs, async () => {
          if (this.ownsRows) return await backfill.moveReferenceRows(tableName, batchSize);
          const count = await backfill.seedReferenceRows(tableName, batchSize, seeded);
          seeded += count;
          return count;
        });
      }

      await this.drain('changelog', batchSize, sleepMs, () =>
        backfill.rewriteChangelogEntries(batchSize),
      );
    } catch (error) {
      if (error instanceof InsufficientStorageError) {
        // The store grows before the database gives the space back, so a tight
        // volume stops the job rather than eating into the system's reserve.
        // Remaining content stays where it is and the next run picks it up.
        log.warn('BlobBackfillTask: paused, not enough free disk to admit more content', {
          message: error.message,
        });
        return;
      }
      throw error;
    }

    await this.reportCompletion(backfill);
  }

  /** Work one unit until a batch comes back short, pausing between batches. */
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

    // Nothing left holding bytes is only half of done: every hash now referenced
    // must resolve to content this server actually holds.
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
