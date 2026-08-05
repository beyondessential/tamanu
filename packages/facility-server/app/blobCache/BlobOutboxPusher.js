import { BLOB_TIERS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { blobOutboxStatus } from './outboxStatus';

// Successful sync cycles an eligible blob may go unpushed before the outbox is
// reported as dysfunctional: the connection works but the push path does not.
// spec: CAP
const DYSFUNCTION_SYNC_CYCLES = 3;

// spec: CACHE
// Drains the outbox to the central server: oldest-first among blobs whose
// referencing record has synchronised, skipping past failures, one transfer in
// flight per blob. Runs on its own schedule, independent of sync sessions
// (see tasks/BlobOutboxPusherTask); sync sessions call recordSyncCycle so the
// outbox dysfunction measure advances with sync progress, not wall-clock time.
export class BlobOutboxPusher {
  #models;
  #transferChannel;
  #blobCache;
  /** Live array; consumers (attachments, assets) append theirs at startup. */
  #referenceResolvers;
  #inFlight = new Set();

  constructor({ models, transferChannel, blobCache, referenceResolvers = [] }) {
    this.#models = models;
    this.#transferChannel = transferChannel;
    this.#blobCache = blobCache;
    this.#referenceResolvers = referenceResolvers;
  }

  // spec: CACHE
  /**
   * Which of these outbox blobs are eligible for push — a referencing record
   * has synchronised to the central server, determined locally by the
   * consumers' reference resolvers. With no resolvers registered nothing is
   * eligible, so the pusher stays idle until a consumer arrives.
   */
  async eligibleHashes(hashes) {
    const eligible = new Set();
    if (hashes.length === 0) {
      return eligible;
    }
    for (const resolver of this.#referenceResolvers) {
      for (const hash of await resolver(this.#models, hashes)) {
        eligible.add(hash);
      }
    }
    return eligible;
  }

  /** One pass over the outbox; the scheduled task calls this. */
  async runOnce() {
    const outbox = await this.#models.Blob.findAll({
      where: { tier: BLOB_TIERS.OUTBOX },
      // spec: CACHE — oldest-first: the longest-unacknowledged blob is offered first
      order: [['createdAt', 'ASC']],
      attributes: ['hash'],
    });
    const counts = { pushed: 0, failed: 0, ineligible: 0, inFlight: 0 };
    if (outbox.length === 0) {
      return counts;
    }

    const eligible = await this.eligibleHashes(outbox.map(blob => blob.hash));
    for (const { hash } of outbox) {
      if (!eligible.has(hash)) {
        counts.ineligible += 1;
        continue;
      }
      if (this.#inFlight.has(hash)) {
        // spec: CACHE — at most one transfer in flight per blob
        counts.inFlight += 1;
        continue;
      }
      this.#inFlight.add(hash);
      try {
        const { acknowledged } = await this.#transferChannel.pushToCentral(hash);
        if (acknowledged) {
          // spec: XFER — acknowledgement means verified and durably stored on
          // central, so the local copy demotes to evictable cache
          await this.#blobCache.demote(hash);
          counts.pushed += 1;
        }
      } catch (error) {
        // spec: CACHE — a refused or failed offer does not block the queue
        counts.failed += 1;
        log.warn('BlobOutboxPusher: push failed, continuing with next blob', {
          hash,
          error: error.message,
        });
      } finally {
        this.#inFlight.delete(hash);
      }
    }

    if (counts.pushed > 0 || counts.failed > 0) {
      log.info('BlobOutboxPusher: outbox pass complete', counts);
    }
    return counts;
  }

  // spec: CAP
  /**
   * Called after each successful sync cycle. Advances the dysfunction measure
   * for blobs that were eligible for push and not actively transferring: the
   * connection demonstrably works, yet the blob remains undelivered. Blobs
   * whose record has not synchronised, or whose transfer is in flight, are
   * healthy accumulation and don't count.
   */
  async recordSyncCycle() {
    const outbox = await this.#models.Blob.findAll({
      where: { tier: BLOB_TIERS.OUTBOX },
      attributes: ['hash'],
    });
    if (outbox.length === 0) {
      return;
    }
    const eligible = await this.eligibleHashes(outbox.map(blob => blob.hash));
    const countable = [...eligible].filter(hash => !this.#inFlight.has(hash));
    if (countable.length > 0) {
      await this.#models.Blob.increment('syncCyclesUnpushed', {
        where: { hash: countable, tier: BLOB_TIERS.OUTBOX },
      });
    }

    const status = await blobOutboxStatus(this.#models);
    if (status.maxSyncCyclesUnpushed >= DYSFUNCTION_SYNC_CYCLES) {
      // spec: CAP — escalates with both the cycles survived and the space consumed
      log.error('BlobOutboxPusher: outbox dysfunction — blobs surviving sync cycles unpushed', {
        maxSyncCyclesUnpushed: status.maxSyncCyclesUnpushed,
        outboxCount: status.count,
        outboxBytes: status.totalBytes,
      });
    }
  }
}
