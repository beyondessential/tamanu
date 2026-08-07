import { BlobBackfill, REFERENCE_TABLES, createBlobStore } from '@tamanu/database/blobStore';
import { InsufficientStorageError } from '@tamanu/errors';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { log } from '../services/logging';
import { ScheduledTask } from './ScheduledTask';

/**
 * Settings reach this task differently on each server, and that difference is
 * also what tells the two apart: central carries a single reader, while a
 * facility carries one per facility plus a global. The store root is a property
 * of the server's disk and this task is server-wide, so on a multi-facility
 * server the first facility's value applies, the same rule the other facility
 * scheduled tasks use.
 */
function resolveServer(context) {
  const { settings } = context;
  if (typeof settings?.get === 'function') {
    return { settings, isCentral: true };
  }
  const [facilityId] = Object.keys(settings ?? {}).filter(key => key !== 'global');
  return { settings: facilityId ? settings[facilityId] : settings?.global, isCentral: false };
}

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
    this.models = context.models ?? context.store?.models;
    this.sequelize = context.sequelize ?? context.store?.sequelize;
    // Only the server that owns a row may rewrite it. Attachment and asset
    // bytes live on central; a facility holds pulled copies whose updates
    // arrive through sync, so it seeds its store and leaves the rows alone.
    const { settings, isCentral } = resolveServer(context);
    this.settings = settings;
    this.ownsRows = isCentral;
  }

  async countQueue() {
    const backfill = await this.getBackfill();
    const { rows, changelogEntries } = await backfill.countRemaining();
    return Object.values(rows).reduce((total, count) => total + count, 0) + changelogEntries;
  }

  async getBackfill() {
    this.backfill ??= new BlobBackfill({
      sequelize: this.sequelize,
      blobStore: await createBlobStore({ models: this.models, settings: this.settings }),
    });
    return this.backfill;
  }

  async run() {
    const { batchSize, batchSleepAsyncDurationInMilliseconds: sleepMs } = this.config;
    const backfill = await this.getBackfill();

    try {
      for (const tableName of REFERENCE_TABLES) {
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
