import { Op, literal } from 'sequelize';

import { BlobEviction } from '@tamanu/blobs';
import { BLOB_TIERS } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

import { UNREFERENCED_BLOB_CONDITION } from './referenceResolvers';

// spec: CACHE
const RECENCY_COALESCE_SECONDS = 60;

// spec: RECL
// A reference is written after its blob is admitted, and stays invisible until a slow enclosing
// transaction commits.
const STRANDED_SAFETY_WINDOW_MS = 60 * 60 * 1000;

// spec: CACHE
// Outbox: un-pushed, the only durable copy, never evicted. Cache: durable on central, evictable
// under an LRU budget.
export class FacilityBlobCache {
  #blobStore;
  #models;
  #transferChannel = null;
  #getCacheBudgetBytes;
  #eviction;

  constructor({ blobStore, models, getCacheBudgetBytes }) {
    this.#blobStore = blobStore;
    this.#models = models;
    this.#getCacheBudgetBytes = getCacheBudgetBytes;
    this.#eviction = new BlobEviction({
      budgetBytes: () => this.#getCacheBudgetBytes(),
      cacheSizeBytes: () => this.cacheSizeBytes(),
      cacheRowsLruFirst: limit => this.#cacheRowsLruFirst(limit),
      mostRecentlyUsedHash: () => this.#mostRecentlyUsedCacheHash(),
      delete: hash => this.#blobStore.delete(hash),
      onWarning: (message, details) => log.warn(`FacilityBlobCache: ${message}`, details),
      onEvicted: summary => log.info('FacilityBlobCache: evicted cache blobs', summary),
    });
  }

  setTransferChannel(transferChannel) {
    this.#transferChannel = transferChannel;
  }

  get transferChannel() {
    return this.#transferChannel;
  }

  // spec: CACHE
  /**
   * Call within the operation that creates the referencing record: facility servers run no orphan
   * collection.
   */
  async putOutbox(source, { sizeHint } = {}) {
    const admitted = await this.#blobStore.put(source, { sizeHint, tier: BLOB_TIERS.OUTBOX });
    if (admitted.existed) {
      await this.#promoteToOutbox(admitted.hash);
    }
    return admitted;
  }

  // spec: CACHE, RECL
  async #promoteToOutbox(hash) {
    const [, [blob]] = await this.#models.Blob.update(
      { tier: BLOB_TIERS.OUTBOX, lastAccessedAt: new Date() },
      { where: { hash }, returning: true },
    );
    if (blob && !blob.hasParity) {
      // spec: FEC
      await this.#blobStore.writeParity({ hash, size: blob.size, tier: blob.tier });
    }
  }

  // spec: CACHE
  /**
   * Demotes rather than deletes, testing the reference in the same statement: these bytes may back
   * a reference this pass can't see.
   */
  async demoteStrandedOutbox() {
    const [, demoted] = await this.#models.Blob.update(
      { tier: BLOB_TIERS.CACHE, eligibleSinceTick: null },
      {
        where: {
          tier: BLOB_TIERS.OUTBOX,
          lastAccessedAt: { [Op.lt]: new Date(Date.now() - STRANDED_SAFETY_WINDOW_MS) },
          [Op.and]: [literal(UNREFERENCED_BLOB_CONDITION)],
        },
        returning: ['hash'],
      },
    );
    for (const blob of demoted) {
      // spec: FEC
      await this.#blobStore.discardParity(blob.hash);
    }
    const hashes = demoted.map(blob => blob.hash);
    if (hashes.length > 0) {
      log.info('FacilityBlobCache: demoted stranded outbox blobs', { hashes });
    }
    return hashes;
  }

  // spec: CACHE
  async open(hash, { start, end } = {}) {
    // Retain before the stat check, or a concurrent eviction could turn a refetchable read into a
    // not-found.
    this.#retainRead(hash);
    try {
      // spec: SCRUB
      if (!(await this.#blobStore.servableStat(hash))) {
        if (!this.#transferChannel) {
          throw new NotFoundError(
            `Blob not held locally and no central connection to fetch it: ${hash}`,
          );
        }
        await this.#transferChannel.fetchFromCentral(hash);
        // Enforcement never evicts the most recently used blob, which the new arrival is.
        try {
          await this.enforceBudget();
        } catch (error) {
          log.warn('FacilityBlobCache.open: budget enforcement after fetch failed', {
            hash,
            error: error.message,
          });
        }
      }
      await this.#touch(hash);
      const stream = await this.#blobStore.get(hash, { start, end });
      this.#releaseReadOnClose(hash, stream);
      return stream;
    } catch (error) {
      this.#releaseRead(hash);
      throw error;
    }
  }

  // spec: CACHE
  async demote(hash) {
    const [demoted] = await this.#models.Blob.update(
      { tier: BLOB_TIERS.CACHE, eligibleSinceTick: null },
      { where: { hash, tier: BLOB_TIERS.OUTBOX } },
    );
    if (demoted) {
      // spec: FEC
      await this.#blobStore.discardParity(hash);
    }
  }

  async cacheSizeBytes() {
    const total = await this.#models.Blob.sum('size', {
      where: { tier: BLOB_TIERS.CACHE },
    });
    // SUM over BIGINT can arrive as a string from the pg driver.
    return Number(total ?? 0);
  }

  async enforceBudget() {
    return await this.#eviction.enforceBudget();
  }

  async evictBytes(bytesNeeded) {
    return await this.#eviction.evictBytes(bytesNeeded);
  }

  async #cacheRowsLruFirst(limit) {
    const rows = await this.#models.Blob.findAll({
      where: { tier: BLOB_TIERS.CACHE },
      order: [
        ['lastAccessedAt', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      attributes: ['hash', 'size'],
      limit,
    });
    return rows.map(({ hash, size }) => ({ hash, size: Number(size) }));
  }

  async #mostRecentlyUsedCacheHash() {
    const row = await this.#models.Blob.findOne({
      where: { tier: BLOB_TIERS.CACHE },
      order: [
        ['lastAccessedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      attributes: ['hash'],
    });
    return row?.hash ?? null;
  }

  async #touch(hash) {
    await this.#blobStore.touch(hash, { coalesceSeconds: RECENCY_COALESCE_SECONDS });
  }

  #retainRead(hash) {
    this.#eviction.retainRead(hash);
  }

  #releaseRead(hash) {
    this.#eviction.releaseRead(hash);
  }

  #releaseReadOnClose(hash, stream) {
    // 'close' fires on completion and destruction, so the retain releases exactly once.
    stream.once('close', () => this.#releaseRead(hash));
  }
}
