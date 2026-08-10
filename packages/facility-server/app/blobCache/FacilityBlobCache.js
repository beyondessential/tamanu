import { BLOB_TIERS } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

// Reads within this window of the last recorded access don't rewrite recency.
// spec: CACHE — recency updates may be coalesced; losing the most recent
// refreshes degrades eviction ordering only.
const RECENCY_COALESCE_SECONDS = 60;

// Upper bound on cache rows scanned per eviction pass, so a facility with a very
// large cache population never materialises the whole tier in memory. A cache
// bigger than this is trimmed across successive passes (the periodic evictor and
// admission-time enforcement), which is fine — eviction need not converge in one
// pass.
const EVICTION_SCAN_LIMIT = 10000;

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
  /** hash -> count of reads currently streaming, so eviction defers removal. */
  #activeReads = new Map();

  constructor({ blobStore, models, getCacheBudgetBytes }) {
    this.#blobStore = blobStore;
    this.#models = models;
    this.#getCacheBudgetBytes = getCacheBudgetBytes;
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
      // spec: SCRUB — servableStat, so a local copy the store will not serve
      // (corrupt, or absent bytes under a live row) is a miss and resolves
      // from central like any other, rather than failing the read against the
      // copy it already has.
      if (!(await this.#blobStore.servableStat(hash))) {
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

  // spec: CACHE
  /**
   * Evict least-recently-used cache blobs until the cache fits its size
   * budget. The budget is a target, not a hard limit: the single most
   * recently used blob is never evicted merely to satisfy it, so a blob
   * larger than the whole budget serves reads while it is in use rather than
   * cycling through eviction and refetch.
   */
  async enforceBudget() {
    const budget = await this.#getCacheBudgetBytes();
    if (!Number.isFinite(budget)) {
      // A misconfigured or unset budget must not be read as "evict everything";
      // leave the cache untouched and let the periodic task retry once fixed.
      log.warn('FacilityBlobCache.enforceBudget: cache size budget is not a finite number', {
        budget,
      });
      return { evictedBytes: 0, evictedCount: 0 };
    }
    const excess = (await this.cacheSizeBytes()) - budget;
    if (excess <= 0) {
      return { evictedBytes: 0, evictedCount: 0 };
    }
    // Withhold the single most-recently-used cache blob from budget eviction so
    // an oversized in-use blob isn't thrashed. Identified explicitly (rather
    // than as the tail of the scanned rows) because the scan is a bounded
    // oldest-first batch that need not contain the newest blob.
    const protectHash = await this.#mostRecentlyUsedCacheHash();
    return await this.#evictRows(await this.#cacheRowsLruFirst(), excess, { protectHash });
  }

  // spec: CAP
  /**
   * Free at least bytesNeeded for the free-disk floor. The floor is the hard
   * bound, so unlike budget enforcement every cache blob is a candidate —
   * only outbox blobs and blobs with a read in progress are untouchable.
   */
  async evictBytes(bytesNeeded) {
    return await this.#evictRows(await this.#cacheRowsLruFirst(), bytesNeeded);
  }

  // The least-recently-used cache blobs, bounded so memory stays flat regardless
  // of cache population. Eviction stops once its byte target is met, so a scan
  // that reaches the limit without meeting it simply continues next pass.
  async #cacheRowsLruFirst() {
    return await this.#models.Blob.findAll({
      where: { tier: BLOB_TIERS.CACHE },
      order: [
        ['lastAccessedAt', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      attributes: ['hash', 'size'],
      limit: EVICTION_SCAN_LIMIT,
    });
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

  async #evictRows(rows, bytesTarget, { protectHash = null } = {}) {
    let evictedBytes = 0;
    let evictedCount = 0;
    for (const { hash, size } of rows) {
      if (evictedBytes >= bytesTarget) break;
      if (hash === protectHash) {
        // spec: CACHE — the most-recently-used blob is withheld from budget
        // eviction (not from the free-disk floor, which passes no protectHash).
        continue;
      }
      if (this.#activeReads.has(hash)) {
        // spec: CACHE — a blob with a read in progress is removed only once
        // that read completes; it stays a candidate for a later pass.
        continue;
      }
      try {
        await this.#blobStore.delete(hash);
        // size arrives via the model's BIGINT getter as a number, but coerce
        // defensively so the accumulator can never become a string.
        evictedBytes += Number(size);
        evictedCount += 1;
      } catch (error) {
        log.warn('FacilityBlobCache: eviction of blob failed, skipping', {
          hash,
          error: error.message,
        });
      }
    }
    if (evictedCount > 0) {
      log.info('FacilityBlobCache: evicted cache blobs', { evictedCount, evictedBytes });
    }
    return { evictedBytes, evictedCount };
  }

  async #touch(hash) {
    // Coalesced recency: a no-op while the recorded access is fresh, so hot
    // blobs don't rewrite the registry on every read.
    await this.#models.Blob.sequelize.query(
      `
        UPDATE blobs
        SET last_accessed_at = now()
        WHERE hash = $hash
          AND last_accessed_at < now() - make_interval(secs => $coalesceSeconds)
      `,
      { bind: { hash, coalesceSeconds: RECENCY_COALESCE_SECONDS } },
    );
  }

  #retainRead(hash) {
    this.#activeReads.set(hash, (this.#activeReads.get(hash) ?? 0) + 1);
  }

  #releaseRead(hash) {
    const count = this.#activeReads.get(hash) ?? 0;
    if (count <= 1) {
      this.#activeReads.delete(hash);
    } else {
      this.#activeReads.set(hash, count - 1);
    }
  }

  #releaseReadOnClose(hash, stream) {
    // 'close' fires on both completion and destruction (error or abandoned
    // stream), so the retain always releases exactly once.
    stream.once('close', () => this.#releaseRead(hash));
  }
}
