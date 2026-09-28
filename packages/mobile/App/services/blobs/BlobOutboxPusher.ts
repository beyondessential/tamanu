import { BlobOutbox, OutboxCounts } from '@tamanu/blobs';
import { BLOB_TIERS } from '@tamanu/constants';

import { MODELS_MAP } from '~/models/modelsMap';
import { getSyncTick } from '~/services/sync/utils';
import { LAST_SUCCESSFUL_PUSH } from '~/services/sync/constants';
import { BlobTransferChannel } from './BlobTransferChannel';
import { MobileBlobCache } from './MobileBlobCache';

// spec: CAP
// In sync ticks, roughly several sync cycles. Central-side monitoring is the authoritative signal;
// this is a coarse aid.
const DYSFUNCTION_PUSH_TICK_GAP = 6;

// An outbox grown during a long outage drains across successive sync cycles.
const OUTBOX_SCAN_LIMIT = 100;

export interface BlobOutboxPusherOptions {
  models: typeof MODELS_MAP;
  transferChannel: BlobTransferChannel;
  blobCache: MobileBlobCache;
}

// spec: CACHE, MOB
// Runs after each successful sync rather than on a schedule: that's when records are known to be on
// central.
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
        listOutbox: limit => this.#listOutbox(limit),
        push: hash => this.#transferChannel.pushToCentral(hash),
        demote: hash => this.#blobCache.demote(hash),
        onWarning: (message, details) =>
          console.warn(`BlobOutboxPusher: ${message} (${JSON.stringify(details)})`),
      },
      {
        resolvers: [hashes => this.#syncedAttachmentHashes(hashes)],
        scanLimit: OUTBOX_SCAN_LIMIT,
      },
    );
  }

  // spec: CACHE
  async eligibleOutboxHashes(): Promise<string[]> {
    const outbox = await this.#listOutbox(OUTBOX_SCAN_LIMIT);
    const eligible = await this.#outbox.eligibleHashes(outbox);
    return outbox.filter(hash => eligible.has(hash));
  }

  async #listOutbox(limit: number): Promise<string[]> {
    const rows: { hash: string }[] = await this.#models.Blob.getRepository().query(
      `
        SELECT hash
        FROM blobs
        WHERE tier = ?
          AND deletedAt IS NULL
        ORDER BY createdAt ASC
        LIMIT ?
      `,
      [BLOB_TIERS.OUTBOX, limit],
    );
    return rows.map(row => row.hash);
  }

  // spec: CACHE
  /** Synced means the tick is at or behind the push cursor, or the record arrived through sync. */
  async #syncedAttachmentHashes(hashes: string[]): Promise<string[]> {
    const lastPush = await getSyncTick(this.#models, LAST_SUCCESSFUL_PUSH);
    const rows: { hash: string }[] = await this.#models.Attachment.getRepository().query(
      `
        SELECT hash
        FROM attachments
        WHERE deletedAt IS NULL
          AND CAST(updatedAtSyncTick AS INTEGER) <= ?
          AND hash IN (${hashes.map(() => '?').join(', ')})
      `,
      [lastPush, ...hashes],
    );
    return rows.map(row => row.hash);
  }

  async runOnce(): Promise<OutboxCounts> {
    if (this.#running) {
      // Sync cycles can overlap when one runs long; a second pass would offer blobs the first is
      // still pushing.
      return { pushed: 0, failed: 0, skipped: 0, ineligible: 0, inFlight: 0 };
    }
    this.#running = true;
    try {
      return await this.#outbox.runOnce();
    } finally {
      this.#running = false;
    }
  }

  // spec: CAP
  async recordSyncCycle(): Promise<void> {
    const eligible = await this.eligibleOutboxHashes();
    const lastPush = await getSyncTick(this.#models, LAST_SUCCESSFUL_PUSH);
    if (eligible.length > 0) {
      // Stamped once, so the measure counts from when eligibility began.
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
      // spec: CAP
      console.error(
        `BlobOutboxPusher: outbox dysfunction — blobs unpushed across successful syncs ` +
          `(ticksSinceEligible=${ticksSinceEligible}, outboxCount=${row.count}, outboxBytes=${row.totalBytes})`,
      );
    }
  }
}
