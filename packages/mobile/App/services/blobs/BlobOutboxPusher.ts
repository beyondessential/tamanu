import { BlobOutbox } from '@tamanu/blobs';
import { BLOB_TIERS } from '@tamanu/constants';

import { MODELS_MAP } from '~/models/modelsMap';
import { getSyncTick } from '~/services/sync/utils';
import { LAST_SUCCESSFUL_PUSH } from '~/services/sync/constants';
import { BlobTransferChannel } from './BlobTransferChannel';
import { MobileBlobCache } from './MobileBlobCache';

// spec: CAP
// How far the push cursor may advance past a blob's eligibility point before the
// outbox is reported as dysfunctional. Expressed in sync ticks — roughly several
// sync cycles. Central-side monitoring is the authoritative signal; this local
// escalation is a coarse aid.
const DYSFUNCTION_PUSH_TICK_GAP = 6;

// Upper bound on outbox rows handled per pass, so an outbox that grew large
// during an extended outage is drained across successive sync cycles.
// Oldest-first, so the longest-waiting blobs are always handled.
const OUTBOX_SCAN_LIMIT = 100;

export interface BlobOutboxPusherOptions {
  models: typeof MODELS_MAP;
  transferChannel: BlobTransferChannel;
  blobCache: MobileBlobCache;
}

// spec: CACHE, MOB
// Drains the device's outbox to the central server: oldest-first among blobs
// whose referencing attachment record has synchronised, skipping past failures.
// Runs after each successful sync cycle rather than on its own schedule — the
// device is intermittently awake and a sync is the moment records are known to
// be on central, so a push attempted then is the one most likely to be accepted.
export class BlobOutboxPusher {
  #models: typeof MODELS_MAP;
  #transferChannel: BlobTransferChannel;
  #blobCache: MobileBlobCache;
  #running = false;
  #outbox: BlobOutbox;

  constructor({ models, transferChannel, blobCache }: BlobOutboxPusherOptions) {
    this.#models = models;
    this.#transferChannel = transferChannel;
    this.#blobCache = blobCache;
    this.#outbox = new BlobOutbox(
      {
        // The listing query already filters to eligible blobs, so the pass has
        // nothing further to resolve.
        listOutbox: () => this.eligibleOutboxHashes(),
        push: hash => this.#transferChannel.pushToCentral(hash),
        demote: hash => this.#blobCache.demote(hash),
        onWarning: (message, details) =>
          console.warn(`BlobOutboxPusher: ${message} (${JSON.stringify(details)})`),
      },
      { resolvers: [async hashes => hashes], scanLimit: OUTBOX_SCAN_LIMIT },
    );
  }

  // spec: CACHE
  /**
   * Which outbox blobs are eligible for push: a live attachment record carries
   * the hash and has itself reached the central server — its sync tick is at
   * or behind the push cursor, or it arrived through sync in the first place.
   */
  async eligibleOutboxHashes(): Promise<string[]> {
    const lastPush = await getSyncTick(this.#models, LAST_SUCCESSFUL_PUSH);
    const rows: { hash: string }[] = await this.#models.Blob.getRepository().query(
      `
        SELECT blobs.hash AS hash
        FROM blobs
        WHERE blobs.tier = ?
          AND blobs.deletedAt IS NULL
          AND EXISTS (
            SELECT 1 FROM attachments
            WHERE attachments.hash = blobs.hash
              AND attachments.deletedAt IS NULL
              AND CAST(attachments.updatedAtSyncTick AS INTEGER) <= ?
          )
        ORDER BY blobs.createdAt ASC
        LIMIT ?
      `,
      [BLOB_TIERS.OUTBOX, lastPush, OUTBOX_SCAN_LIMIT],
    );
    return rows.map(row => row.hash);
  }

  /** One pass over the outbox; run after each successful sync cycle. */
  async runOnce(): Promise<{ pushed: number; failed: number; skipped: number }> {
    if (this.#running) {
      // The device runs this off sync cycles, which can overlap when one runs
      // long; a second pass would offer blobs the first is still pushing.
      return { pushed: 0, failed: 0, skipped: 0 };
    }
    this.#running = true;
    try {
      return await this.#outbox.runOnce();
    } finally {
      this.#running = false;
    }
  }

  // spec: CAP
  /**
   * Called after each successful sync cycle. Marks the push cursor at which
   * each eligible outbox blob was first seen eligible, then reports
   * dysfunction by comparing the oldest such marker against the current push
   * cursor — a blob still unpushed while syncs keep succeeding.
   */
  async recordSyncCycle(): Promise<void> {
    const eligible = await this.eligibleOutboxHashes();
    const lastPush = await getSyncTick(this.#models, LAST_SUCCESSFUL_PUSH);
    if (eligible.length > 0) {
      // Stamp the eligibility marker once: blobs already marked keep their
      // original value, so the measure counts from when eligibility began.
      await this.#models.Blob.getRepository().query(
        `
          UPDATE blobs
          SET eligibleSinceTick = ?
          WHERE tier = ?
            AND deletedAt IS NULL
            AND eligibleSinceTick IS NULL
            AND hash IN (${eligible.map(() => '?').join(', ')})
        `,
        [lastPush, BLOB_TIERS.OUTBOX, ...eligible],
      );
    }

    const [row] = await this.#models.Blob.getRepository().query(
      `
        SELECT MIN(CAST(eligibleSinceTick AS INTEGER)) AS oldest, COUNT(*) AS count,
               COALESCE(SUM(size), 0) AS totalBytes
        FROM blobs
        WHERE tier = ? AND deletedAt IS NULL AND eligibleSinceTick IS NOT NULL
      `,
      [BLOB_TIERS.OUTBOX],
    );
    if (row?.oldest == null) {
      return;
    }
    const ticksSinceEligible = lastPush - Number(row.oldest);
    if (ticksSinceEligible >= DYSFUNCTION_PUSH_TICK_GAP) {
      // spec: CAP — escalates with both sync progress since eligibility and
      // the space the outbox is consuming
      console.error(
        `BlobOutboxPusher: outbox dysfunction — blobs unpushed across successful syncs ` +
          `(ticksSinceEligible=${ticksSinceEligible}, outboxCount=${row.count}, outboxBytes=${row.totalBytes})`,
      );
    }
  }
}
