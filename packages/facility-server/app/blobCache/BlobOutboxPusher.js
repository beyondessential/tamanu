import { Op } from 'sequelize';

import { BLOB_TIERS } from '@tamanu/constants';
import { FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { log } from '@tamanu/shared/services/logging';

import { blobOutboxStatus } from './outboxStatus';

// spec: CAP
// How far the push cursor may advance past a blob's eligibility point before the
// outbox is reported as dysfunctional. Expressed in sync ticks: central advances
// the push cursor by a small amount each successful session, so this is roughly
// several sync cycles. Central-side monitoring is the authoritative signal (see
// specs/blob-storage/capacity.md); this local escalation is a coarse aid.
const DYSFUNCTION_PUSH_TICK_GAP = 6;

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
      // Isolate resolvers: one consumer's failing query (e.g. a schema mismatch)
      // must not starve every other consumer's blobs of eligibility.
      try {
        for (const hash of await resolver(this.#models, hashes)) {
          eligible.add(hash);
        }
      } catch (error) {
        log.warn('BlobOutboxPusher: a reference resolver failed, skipping it this pass', {
          error: error.message,
        });
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
   * Called after each successful sync cycle. Marks the sync progress at which
   * each eligible outbox blob was first seen eligible, then reports dysfunction
   * by comparing the oldest such marker against the current push cursor — a
   * blob still unpushed while syncs keep succeeding. Set once per blob and
   * compared against live sync state, rather than accumulated per cycle.
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
    if (eligible.size > 0) {
      // Stamp the eligibility marker once: the push cursor at the first cycle a
      // blob was seen eligible. Blobs already marked keep their original value,
      // so the measure counts from when eligibility began, not this cycle.
      await this.#models.Blob.update(
        { eligibleSinceTick: await this.#currentPushTick() },
        {
          where: {
            hash: [...eligible],
            tier: BLOB_TIERS.OUTBOX,
            eligibleSinceTick: null,
          },
        },
      );
    }

    await this.#reportDysfunction();
  }

  // spec: CAP
  // A blob whose transfer is actively in flight is healthy accumulation, so it
  // is excluded here: dysfunction is the oldest marker among eligible outbox
  // blobs not currently being pushed, measured against the current push cursor.
  async #reportDysfunction() {
    const inFlight = [...this.#inFlight];
    const oldestEligibleTick = await this.#models.Blob.min('eligibleSinceTick', {
      where: {
        tier: BLOB_TIERS.OUTBOX,
        eligibleSinceTick: { [Op.not]: null },
        ...(inFlight.length > 0 ? { hash: { [Op.notIn]: inFlight } } : {}),
      },
    });
    if (oldestEligibleTick == null) {
      return;
    }
    const ticksSinceEligible = (await this.#currentPushTick()) - Number(oldestEligibleTick);
    if (ticksSinceEligible >= DYSFUNCTION_PUSH_TICK_GAP) {
      const status = await blobOutboxStatus(this.#models);
      // spec: CAP — escalates with both sync progress since eligibility and the
      // space the outbox is consuming
      log.error('BlobOutboxPusher: outbox dysfunction — blobs unpushed across successful syncs', {
        ticksSinceEligible,
        outboxCount: status.count,
        outboxBytes: status.totalBytes,
      });
    }
  }

  async #currentPushTick() {
    const value = await this.#models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH);
    return value == null ? -1 : Number(value);
  }
}
