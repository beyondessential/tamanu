import { BlobEviction } from '@tamanu/blobs';
import { BLOB_TIERS } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

// Reads within this window of the last recorded access don't rewrite recency.
// spec: CACHE — recency updates may be coalesced; losing the most recent
// refreshes degrades eviction ordering only.
const RECENCY_COALESCE_SECONDS = 60;

// spec: CACHE
// The facility store's two durability tiers over the blob store primitive: the
// outbox (un-pushed blobs, the only durable copy, never evicted) and the cache
// (durable on central, evictable under an LRU size budget). This class owns
// admission to the outbox, read-through with recency, demotion once central
// acknowledges, and eviction; the background pusher drives it from the outbox
// side (see BlobOutboxPusher).
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

  /** Wired once the sync runtime is up; reads work local-only without it. */
  setTransferChannel(transferChannel) {
    this.#transferChannel = transferChannel;
  }

  /** The channel, where one is wired — the API process supplies its own. */
  get transferChannel() {
    return this.#transferChannel;
  }

  // spec: CACHE
  /**
   * Admit locally originated content into the outbox. Call within the
   * operation that creates the blob's referencing record — outbox admission
   * without a reference strands the blob, since facility servers run no
   * orphan collection. Content already held as cache stays cache: it is
   * already durable on central and needs no push.
   */
  async putOutbox(source, { sizeHint } = {}) {
    return await this.#blobStore.put(source, { sizeHint, tier: BLOB_TIERS.OUTBOX });
  }

  // spec: CACHE
  /**
   * Read-through: stream the blob's bytes, fetching from the central server
   * on a local miss, refreshing recency, and holding off eviction while the
   * read is in progress.
   */
  async open(hash, { start, end } = {}) {
    // Retain before the stat check so eviction defers for the whole open
    // window: without this, a concurrent eviction between stat and get could
    // hard-delete the blob and turn a refetchable read into a not-found.
    this.#retainRead(hash);
    try {
      if (!(await this.#blobStore.stat(hash))) {
        if (!this.#transferChannel) {
          throw new NotFoundError(
            `Blob not held locally and no central connection to fetch it: ${hash}`,
          );
        }
        await this.#transferChannel.fetchFromCentral(hash);
        // A fetch admission may take the cache over budget; enforcement never
        // evicts the most recently used blob, which the new arrival is.
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
      // Hand the retain over to the stream: it is released once reading ends.
      this.#releaseReadOnClose(hash, stream);
      return stream;
    } catch (error) {
      this.#releaseRead(hash);
      throw error;
    }
  }

  // spec: CACHE
  /** Move an acknowledged blob from outbox to cache: durable on central, evictable. */
  async demote(hash) {
    await this.#models.Blob.update(
      { tier: BLOB_TIERS.CACHE, eligibleSinceTick: null },
      { where: { hash, tier: BLOB_TIERS.OUTBOX } },
    );
  }

  async cacheSizeBytes() {
    const total = await this.#models.Blob.sum('size', {
      where: { tier: BLOB_TIERS.CACHE },
    });
    // SUM over BIGINT can arrive as a string from the pg driver; coerce so
    // callers compare numbers, not a string against a number.
    return Number(total ?? 0);
  }

  async enforceBudget() {
    return await this.#eviction.enforceBudget();
  }

  async evictBytes(bytesNeeded) {
    return await this.#eviction.evictBytes(bytesNeeded);
  }

  // The least-recently-used cache blobs, bounded so memory stays flat regardless
  // of cache population. Outbox blobs are absent by construction: they are the
  // only durable copy and are never eviction candidates.
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
    // size arrives via the model's BIGINT getter as a number, but coerce
    // defensively so the accumulator can never become a string.
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
    // 'close' fires on both completion and destruction (error or abandoned
    // stream), so the retain always releases exactly once.
    stream.once('close', () => this.#releaseRead(hash));
  }
}
