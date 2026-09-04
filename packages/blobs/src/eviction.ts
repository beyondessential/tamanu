// Upper bound on cache rows scanned per eviction pass, so a host with a very
// large cache population never materialises the whole tier in memory. A cache
// bigger than this is trimmed across successive passes, which is fine: eviction
// need not converge in one pass.
export const DEFAULT_EVICTION_SCAN_LIMIT = 10000;

export interface EvictionResult {
  evictedBytes: number;
  evictedCount: number;
}

export interface CacheRow {
  hash: string;
  size: number;
}

export interface BlobEvictionHost {
  /**
   * The cache size budget in bytes. Takes the current cache size because a
   * budget may be a function of it: a host sizing the cache against free space
   * counts the space the cache itself occupies as available to it.
   */
  budgetBytes(cacheSizeBytes: number): Promise<number>;
  cacheSizeBytes(): Promise<number>;
  /** Cache rows least-recently-used first, at most `limit`. */
  cacheRowsLruFirst(limit: number): Promise<CacheRow[]>;
  mostRecentlyUsedHash(): Promise<string | null>;
  delete(hash: string): Promise<void>;
  onWarning?(message: string, details: Record<string, unknown>): void;
  onEvicted?(summary: EvictionResult): void;
}

// spec: CACHE
/**
 * Eviction over the cache tier: LRU ordering, the withheld most-recently-used
 * blob, deferral while a read is in progress, and the budget-as-target versus
 * free-disk-floor-as-hard-bound distinction.
 */
export class BlobEviction {
  #host: BlobEvictionHost;
  #scanLimit: number;
  /** hash -> count of reads currently streaming, so eviction defers removal. */
  #activeReads = new Map<string, number>();

  constructor(host: BlobEvictionHost, { scanLimit }: { scanLimit?: number } = {}) {
    this.#host = host;
    this.#scanLimit = scanLimit ?? DEFAULT_EVICTION_SCAN_LIMIT;
  }

  retainRead(hash: string): void {
    this.#activeReads.set(hash, (this.#activeReads.get(hash) ?? 0) + 1);
  }

  releaseRead(hash: string): void {
    const count = this.#activeReads.get(hash) ?? 0;
    if (count <= 1) {
      this.#activeReads.delete(hash);
    } else {
      this.#activeReads.set(hash, count - 1);
    }
  }

  // spec: CACHE
  /**
   * Evict least-recently-used cache blobs until the cache fits its size budget.
   * The budget is a target, not a hard limit: the single most recently used blob
   * is never evicted merely to satisfy it, so a blob larger than the whole
   * budget serves reads while it is in use rather than cycling through eviction
   * and refetch.
   */
  async enforceBudget(): Promise<EvictionResult> {
    const cacheSize = await this.#host.cacheSizeBytes();
    const budget = await this.#host.budgetBytes(cacheSize);
    if (!Number.isFinite(budget)) {
      // A misconfigured or unset budget must not be read as "evict everything";
      // leave the cache untouched and let the periodic task retry once fixed.
      this.#host.onWarning?.('cache size budget is not a finite number', { budget });
      return { evictedBytes: 0, evictedCount: 0 };
    }
    const excess = cacheSize - budget;
    if (excess <= 0) {
      return { evictedBytes: 0, evictedCount: 0 };
    }
    // Withhold the single most-recently-used cache blob from budget eviction so
    // an oversized in-use blob isn't thrashed. Identified explicitly (rather
    // than as the tail of the scanned rows) because the scan is a bounded
    // oldest-first batch that need not contain the newest blob.
    const protectHash = await this.#host.mostRecentlyUsedHash();
    return await this.#evict(excess, { protectHash });
  }

  // spec: CAP
  /**
   * Free at least bytesNeeded for the free-disk floor. The floor is the hard
   * bound, so unlike budget enforcement every cache blob is a candidate: only
   * blobs with a read in progress are untouchable.
   */
  async evictBytes(bytesNeeded: number): Promise<EvictionResult> {
    return await this.#evict(bytesNeeded);
  }

  async #evict(
    bytesTarget: number,
    { protectHash = null }: { protectHash?: string | null } = {},
  ): Promise<EvictionResult> {
    const rows = await this.#host.cacheRowsLruFirst(this.#scanLimit);
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
        // spec: CACHE — a blob with a read in progress is removed only once that
        // read completes; it stays a candidate for a later pass.
        continue;
      }
      try {
        await this.#host.delete(hash);
        evictedBytes += Number(size);
        evictedCount += 1;
      } catch (error) {
        this.#host.onWarning?.('eviction of blob failed, skipping', {
          hash,
          error: (error as Error).message,
        });
      }
    }
    if (evictedCount > 0) {
      this.#host.onEvicted?.({ evictedCount, evictedBytes });
    }
    return { evictedBytes, evictedCount };
  }
}
