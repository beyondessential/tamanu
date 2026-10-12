// A cache bigger than this is trimmed across successive passes.
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
   * Takes the current cache size: a host sizing against free space counts the cache's own space as
   * available.
   */
  budgetBytes(cacheSizeBytes: number): Promise<number>;
  cacheSizeBytes(): Promise<number>;
  cacheRowsLruFirst(limit: number): Promise<CacheRow[]>;
  mostRecentlyUsedHash(): Promise<string | null>;
  delete(hash: string): Promise<void>;
  onWarning?(message: string, details: Record<string, unknown>): void;
  onEvicted?(summary: EvictionResult): void;
}

// spec: CACHE
export class BlobEviction {
  #host: BlobEvictionHost;
  #scanLimit: number;
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
   * The budget is a target: the most recently used blob is never evicted for it, so an oversized
   * in-use blob isn't thrashed.
   */
  async enforceBudget(): Promise<EvictionResult> {
    const cacheSize = await this.#host.cacheSizeBytes();
    const budget = await this.#host.budgetBytes(cacheSize);
    if (!Number.isFinite(budget)) {
      // An unset budget must not read as "evict everything".
      this.#host.onWarning?.('cache size budget is not a finite number', { budget });
      return { evictedBytes: 0, evictedCount: 0 };
    }
    const excess = cacheSize - budget;
    if (excess <= 0) {
      return { evictedBytes: 0, evictedCount: 0 };
    }
    // Looked up explicitly: the bounded oldest-first scan need not contain the newest blob.
    const protectHash = await this.#host.mostRecentlyUsedHash();
    return await this.#evict(excess, { protectHash });
  }

  // spec: CAP
  /** The floor is the hard bound, so only blobs with a read in progress are untouchable. */
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
        // spec: CACHE
        continue;
      }
      if (this.#activeReads.has(hash)) {
        // spec: CACHE
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
