import { describe, expect, it } from 'vitest';

import { BlobEviction, type BlobEvictionHost, type CacheRow } from '../src/eviction';

interface EvictionState {
  budget: number;
  rows: CacheRow[];
  deleted: string[];
  warnings: string[];
}

function createHost(overrides: Partial<BlobEvictionHost> = {}) {
  const state: EvictionState = { budget: Infinity, rows: [], deleted: [], warnings: [] };

  const host: BlobEvictionHost = {
    async budgetBytes() {
      return state.budget;
    },
    async cacheSizeBytes() {
      return state.rows.reduce((total, row) => total + row.size, 0);
    },
    async cacheRowsLruFirst(limit) {
      return state.rows.filter(row => !state.deleted.includes(row.hash)).slice(0, limit);
    },
    async mostRecentlyUsedHash() {
      return state.rows.at(-1)?.hash ?? null;
    },
    async delete(hash) {
      state.deleted.push(hash);
    },
    onWarning(message) {
      state.warnings.push(message);
    },
    ...overrides,
  };

  return { host, state };
}

// Rows are given least-recently-used first, so the last one is the most
// recently used.
const rows = (...sizes: number[]): CacheRow[] =>
  sizes.map((size, index) => ({ hash: `blob-${index}`, size }));

describe('budget enforcement', () => {
  it('evicts least-recently-used first', async () => {
    const { host, state } = createHost();
    state.rows = rows(100, 100, 100);
    state.budget = 150;

    const result = await new BlobEviction(host).enforceBudget();

    expect(state.deleted).toEqual(['blob-0', 'blob-1']);
    expect(result).toEqual({ evictedCount: 2, evictedBytes: 200 });
  });

  it('withholds the most-recently-used blob', async () => {
    const { host, state } = createHost();
    state.rows = rows(100, 100);
    state.budget = 0;

    const result = await new BlobEviction(host).enforceBudget();

    expect(state.deleted).toEqual(['blob-0']);
    expect(result.evictedCount).toBe(1);
  });

  it('evicts nothing when the budget is not a finite number', async () => {
    const { host, state } = createHost();
    state.rows = rows(100, 100);
    state.budget = Number.NaN;

    const result = await new BlobEviction(host).enforceBudget();

    expect(state.deleted).toEqual([]);
    expect(result).toEqual({ evictedCount: 0, evictedBytes: 0 });
    expect(state.warnings).toContain('cache size budget is not a finite number');
  });

  it('evicts nothing when the cache is within budget', async () => {
    const { host, state } = createHost();
    state.rows = rows(100);
    state.budget = 500;

    expect(await new BlobEviction(host).enforceBudget()).toEqual({
      evictedCount: 0,
      evictedBytes: 0,
    });
    expect(state.deleted).toEqual([]);
  });

  it('stops once the byte target is met', async () => {
    const { host, state } = createHost();
    state.rows = rows(100, 100, 100, 100);
    state.budget = 300;

    await new BlobEviction(host).enforceBudget();

    expect(state.deleted).toEqual(['blob-0']);
  });

  it('skips a blob whose deletion fails and carries on', async () => {
    const { host, state } = createHost({
      async delete(hash) {
        if (hash === 'blob-0') {
          throw new Error('file busy');
        }
        state.deleted.push(hash);
      },
    });
    state.rows = rows(100, 100, 100);
    state.budget = 150;

    const result = await new BlobEviction(host).enforceBudget();

    expect(state.deleted).toEqual(['blob-1']);
    expect(result.evictedCount).toBe(1);
    expect(state.warnings).toContain('eviction of blob failed, skipping');
  });
});

describe('reads in progress', () => {
  it('does not evict a blob being read, and evicts it on a later pass', async () => {
    const { host, state } = createHost();
    state.rows = rows(100, 100, 100);
    state.budget = 150;

    const eviction = new BlobEviction(host);
    eviction.retainRead('blob-0');
    const first = await eviction.enforceBudget();

    expect(state.deleted).toEqual(['blob-1']);
    expect(first.evictedCount).toBe(1);

    eviction.releaseRead('blob-0');
    await eviction.enforceBudget();

    expect(state.deleted).toEqual(['blob-1', 'blob-0']);
  });

  it('holds the retain until the last concurrent read releases it', async () => {
    const { host, state } = createHost();
    state.rows = rows(100, 100);
    state.budget = 0;

    const eviction = new BlobEviction(host);
    eviction.retainRead('blob-0');
    eviction.retainRead('blob-0');
    eviction.releaseRead('blob-0');
    await eviction.enforceBudget();

    expect(state.deleted).toEqual([]);
  });
});

describe('free-disk floor', () => {
  it('has no protected blob, unlike budget eviction', async () => {
    const { host, state } = createHost();
    state.rows = rows(100, 100);

    const result = await new BlobEviction(host).evictBytes(200);

    expect(state.deleted).toEqual(['blob-0', 'blob-1']);
    expect(result.evictedBytes).toBe(200);
  });

  it('still defers a blob with a read in progress', async () => {
    const { host, state } = createHost();
    state.rows = rows(100, 100);

    const eviction = new BlobEviction(host);
    eviction.retainRead('blob-0');
    await eviction.evictBytes(200);

    expect(state.deleted).toEqual(['blob-1']);
  });
});
