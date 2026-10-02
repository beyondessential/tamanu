import { Op, literal } from 'sequelize';

import { BlobOutbox, DEFAULT_OUTBOX_SCAN_LIMIT } from '@tamanu/blobs';
import { BLOB_SCAN_VERDICTS, BLOB_TIERS } from '@tamanu/constants';
import { FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { log } from '@tamanu/shared/services/logging';

import { blobOutboxStatus } from './outboxStatus';

// spec: CAP
// In sync ticks, roughly several sync cycles. Central-side monitoring is the authoritative signal;
// this is a coarse aid.
const DYSFUNCTION_PUSH_TICK_GAP = 6;

// spec: AV
// A local verdict never propagates, so withholding the push is what keeps the content off central.
const PUSHABLE_OUTBOX = {
  tier: BLOB_TIERS.OUTBOX,
  [Op.and]: [
    {
      [Op.or]: [{ scanVerdict: null }, { scanVerdict: { [Op.ne]: BLOB_SCAN_VERDICTS.INFECTED } }],
    },
    {
      hash: { [Op.notIn]: literal('(SELECT hash FROM blob_quarantines WHERE deleted_at IS NULL)') },
    },
  ],
};

// spec: CACHE
// sync sessions call recordSyncCycle so the dysfunction measure advances with sync progress, not
// wall-clock time.
export class BlobOutboxPusher {
  #models;
  #transferChannel;
  #blobCache;
  /** Live array; consumers append theirs at startup. */
  #referenceResolvers;
  #outbox;

  constructor({ models, transferChannel, blobCache, referenceResolvers = [] }) {
    this.#models = models;
    this.#transferChannel = transferChannel;
    this.#blobCache = blobCache;
    this.#referenceResolvers = referenceResolvers;
    this.#outbox = new BlobOutbox(
      {
        listOutbox: limit => this.#listOutbox(limit),
        push: hash => this.#transferChannel.pushToCentral(hash),
        demote: hash => this.#blobCache.demote(hash),
        onWarning: (message, details) => log.warn(`BlobOutboxPusher: ${message}`, details),
      },
      {
        resolvers: () =>
          this.#referenceResolvers.map(resolver => hashes => resolver(this.#models, hashes)),
      },
    );
  }

  async eligibleHashes(hashes) {
    return await this.#outbox.eligibleHashes(hashes);
  }

  async runOnce() {
    const counts = await this.#outbox.runOnce();
    if (counts.pushed > 0 || counts.failed > 0 || counts.skipped > 0) {
      log.info('BlobOutboxPusher: outbox pass complete', counts);
    }
    return counts;
  }

  async #listOutbox(limit) {
    const outbox = await this.#models.Blob.findAll({
      where: PUSHABLE_OUTBOX,
      // spec: CACHE
      order: [['createdAt', 'ASC']],
      attributes: ['hash'],
      limit,
    });
    return outbox.map(blob => blob.hash);
  }

  // spec: CAP
  /**
   * Each blob's marker is set once and compared against live sync state, rather than accumulated
   * per cycle.
   */
  async recordSyncCycle() {
    // A larger backlog is marked across successive cycles.
    const outbox = await this.#listOutbox(DEFAULT_OUTBOX_SCAN_LIMIT);
    if (outbox.length === 0) {
      return;
    }
    const eligible = await this.eligibleHashes(outbox);
    if (eligible.size > 0) {
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
  // A blob actively in flight is healthy accumulation.
  async #reportDysfunction() {
    const inFlight = this.#outbox.inFlight;
    const oldestEligibleTick = await this.#models.Blob.min('eligibleSinceTick', {
      where: {
        ...PUSHABLE_OUTBOX,
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
      // spec: CAP
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
