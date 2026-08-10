import { describe, expect, it } from 'vitest';

import { BLOB_AVAILABILITY_STATES, BLOB_OFFER_STATUSES } from '@tamanu/constants';
import { BlobHashMismatchError, ForbiddenError, NotFoundError } from '@tamanu/errors';

import { BlobTransfer, totalSizeFromHeaders, type BlobTransferHost } from '../src/transfer';

const HASH = 'sha256:abc';

interface HostState {
  held: Map<string, number>;
  staged: Map<string, number>;
  remote: Map<string, number>;
  calls: string[];
  sleeps: number[];
}

/**
 * Records the port calls it received and returns scripted results, so each case
 * asserts on the sequence of decisions rather than on bytes moved.
 */
function createHost(overrides: Partial<BlobTransferHost> = {}) {
  const state: HostState = {
    held: new Map(),
    staged: new Map(),
    remote: new Map(),
    calls: [],
    sleeps: [],
  };

  const host: BlobTransferHost = {
    async stat(hash) {
      state.calls.push(`stat:${hash}`);
      const size = state.held.get(hash);
      return size === undefined ? null : { size };
    },
    async stagedSize(hash) {
      state.calls.push(`stagedSize:${hash}`);
      return state.staged.get(hash) ?? 0;
    },
    async commitStaged(hash) {
      state.calls.push(`commitStaged:${hash}`);
      const size = state.staged.get(hash) ?? 0;
      state.held.set(hash, size);
      state.staged.delete(hash);
      return { hash, size };
    },
    async fetchInto(hash, { offset }) {
      state.calls.push(`fetchInto:${hash}@${offset}`);
      const total = state.remote.get(hash);
      if (total === undefined) {
        throw new NotFoundError(`no such blob ${hash}`);
      }
      state.staged.set(hash, total);
      return { totalSize: total };
    },
    async remoteAvailability(hash) {
      state.calls.push(`remoteAvailability:${hash}`);
      const size = state.remote.get(hash);
      return size === undefined
        ? { availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD }
        : { availability: BLOB_AVAILABILITY_STATES.AVAILABLE, size };
    },
    async offer(hash, { size }) {
      state.calls.push(`offer:${hash}:${size}`);
      return { status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 };
    },
    async pushChunk(hash, { offset, length }) {
      state.calls.push(`pushChunk:${hash}@${offset}+${length}`);
      return { acknowledged: true };
    },
    async sleep(milliseconds) {
      state.sleeps.push(milliseconds);
    },
    ...overrides,
  };

  return { host, state };
}

const fetchCalls = (state: HostState) => state.calls.filter(call => call.startsWith('fetchInto:'));
const pushCalls = (state: HostState) => state.calls.filter(call => call.startsWith('pushChunk:'));

describe('fetch', () => {
  it('requests from offset zero and commits once the total arrives', async () => {
    const { host, state } = createHost();
    state.remote.set(HASH, 120);

    const result = await new BlobTransfer(host).fetch(HASH);

    expect(fetchCalls(state)).toEqual([`fetchInto:${HASH}@0`]);
    expect(result).toEqual({ hash: HASH, size: 120 });
  });

  it('resumes from the staged size rather than from zero', async () => {
    const { host, state } = createHost();
    state.remote.set(HASH, 120);
    state.staged.set(HASH, 40);

    await new BlobTransfer(host).fetch(HASH);

    expect(fetchCalls(state)).toEqual([`fetchInto:${HASH}@40`]);
  });

  it('commits without a further request when staged already covers the known size', async () => {
    const { host, state } = createHost();
    state.remote.set(HASH, 120);
    state.staged.set(HASH, 120);

    const result = await new BlobTransfer(host).fetch(HASH);

    expect(fetchCalls(state)).toEqual([]);
    expect(result).toEqual({ hash: HASH, size: 120 });
  });

  it('does not re-probe a total size it already learned', async () => {
    const { host, state } = createHost({
      async fetchInto(hash, { offset }) {
        state.calls.push(`fetchInto:${hash}@${offset}`);
        state.staged.set(hash, offset + 50);
        return { totalSize: 120 };
      },
    });
    state.remote.set(HASH, 120);

    await new BlobTransfer(host).fetch(HASH);

    expect(state.calls.filter(call => call.startsWith('remoteAvailability:'))).toEqual([]);
    expect(fetchCalls(state)).toEqual([
      `fetchInto:${HASH}@0`,
      `fetchInto:${HASH}@50`,
      `fetchInto:${HASH}@100`,
    ]);
  });

  it('skips the transfer entirely for content already held', async () => {
    const { host, state } = createHost();
    state.held.set(HASH, 120);

    const result = await new BlobTransfer(host).fetch(HASH);

    expect(fetchCalls(state)).toEqual([]);
    expect(result).toEqual({ hash: HASH, size: 120, existed: true });
  });

  it('resets the stalled counter on an attempt that delivers new bytes', async () => {
    let attempt = 0;
    const { host, state } = createHost({
      async fetchInto(hash, { offset }) {
        state.calls.push(`fetchInto:${hash}@${offset}`);
        attempt += 1;
        // Alternates: a failure that moved bytes, then one that moved none, so
        // the run never reaches the limit and the transfer completes.
        if (attempt % 2 === 1) {
          state.staged.set(hash, (state.staged.get(hash) ?? 0) + 30);
          throw new Error('connection reset');
        }
        state.staged.set(hash, 120);
        return { totalSize: 120 };
      },
    });
    state.remote.set(HASH, 120);

    const result = await new BlobTransfer(host).fetch(HASH);

    expect(result).toEqual({ hash: HASH, size: 120 });
    expect(state.sleeps).toEqual([0]);
  });

  it('gives up after the configured run of attempts that deliver nothing', async () => {
    const { host, state } = createHost({
      async fetchInto(hash, { offset }) {
        state.calls.push(`fetchInto:${hash}@${offset}`);
        throw new Error('connection reset');
      },
    });
    state.remote.set(HASH, 120);

    await expect(new BlobTransfer(host, { stalledAttempts: 3 }).fetch(HASH)).rejects.toThrow(
      'connection reset',
    );
    expect(fetchCalls(state)).toHaveLength(3);
  });

  it('retries a body that ends early with the same backoff as an error', async () => {
    let attempt = 0;
    const { host, state } = createHost({
      async fetchInto(hash, { offset }) {
        state.calls.push(`fetchInto:${hash}@${offset}`);
        attempt += 1;
        state.staged.set(hash, attempt === 1 ? 60 : 120);
        return { totalSize: 120 };
      },
    });
    state.remote.set(HASH, 120);

    const transfer = new BlobTransfer(host, { retryBaseMs: 10 });
    const result = await transfer.fetch(HASH);

    expect(fetchCalls(state)).toEqual([`fetchInto:${HASH}@0`, `fetchInto:${HASH}@60`]);
    expect(state.sleeps).toEqual([0]);
    expect(result).toEqual({ hash: HASH, size: 120 });
  });

  it('treats a not-found from the source as terminal', async () => {
    const { host, state } = createHost();

    await expect(new BlobTransfer(host).fetch(HASH)).rejects.toBeInstanceOf(NotFoundError);
    expect(fetchCalls(state)).toHaveLength(1);
    expect(state.sleeps).toEqual([]);
  });

  it('grows the backoff with consecutive stalled attempts', async () => {
    const { host, state } = createHost({
      async fetchInto(hash, { offset }) {
        state.calls.push(`fetchInto:${hash}@${offset}`);
        throw new Error('connection reset');
      },
    });
    state.remote.set(HASH, 120);

    await expect(
      new BlobTransfer(host, { stalledAttempts: 4, retryBaseMs: 100 }).fetch(HASH),
    ).rejects.toThrow('connection reset');
    expect(state.sleeps).toEqual([100, 200, 300]);
  });
});

describe('push', () => {
  it('acknowledges an already-stored offer without moving bytes', async () => {
    const { host, state } = createHost({
      async offer(hash, { size }) {
        state.calls.push(`offer:${hash}:${size}`);
        return { status: BLOB_OFFER_STATUSES.ALREADY_STORED };
      },
    });
    state.held.set(HASH, 120);

    const result = await new BlobTransfer(host).push(HASH);

    expect(result).toEqual({ acknowledged: true, existed: true });
    expect(pushCalls(state)).toEqual([]);
  });

  it('pushes from the receiver’s reported staged count', async () => {
    const { host, state } = createHost({
      async offer(hash, { size }) {
        state.calls.push(`offer:${hash}:${size}`);
        return { status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 80 };
      },
    });
    state.held.set(HASH, 120);

    await new BlobTransfer(host).push(HASH);

    expect(pushCalls(state)).toEqual([`pushChunk:${HASH}@80+40`]);
  });

  it('chunks at the host-supplied size', async () => {
    const { host, state } = createHost();
    state.held.set(HASH, 250);

    await new BlobTransfer(host, { pushChunkBytes: 100 }).push(HASH);

    expect(pushCalls(state)).toEqual([
      `pushChunk:${HASH}@0+100`,
      `pushChunk:${HASH}@100+100`,
      `pushChunk:${HASH}@200+50`,
    ]);
  });

  it('re-offers after a failed chunk and resumes from the relearned position', async () => {
    let chunkAttempts = 0;
    const { host, state } = createHost({
      async offer(hash, { size }) {
        state.calls.push(`offer:${hash}:${size}`);
        return {
          status: BLOB_OFFER_STATUSES.WANTED,
          receivedBytes: chunkAttempts === 0 ? 0 : 60,
        };
      },
      async pushChunk(hash, { offset, length }) {
        state.calls.push(`pushChunk:${hash}@${offset}+${length}`);
        chunkAttempts += 1;
        if (chunkAttempts === 1) {
          throw new Error('connection reset');
        }
        return { acknowledged: true };
      },
    });
    state.held.set(HASH, 120);

    await new BlobTransfer(host, { pushChunkBytes: 100 }).push(HASH);

    expect(pushCalls(state)).toEqual([`pushChunk:${HASH}@0+100`, `pushChunk:${HASH}@60+60`]);
  });

  it('counts a failed re-offer as a stalled attempt and preserves the original error', async () => {
    const { host, state } = createHost({
      async offer(hash, { size }) {
        state.calls.push(`offer:${hash}:${size}`);
        if (state.calls.filter(call => call.startsWith('offer:')).length > 1) {
          throw new Error('offer unreachable');
        }
        return { status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 };
      },
      async pushChunk(hash, { offset, length }) {
        state.calls.push(`pushChunk:${hash}@${offset}+${length}`);
        throw new Error('connection reset');
      },
    });
    state.held.set(HASH, 120);

    await expect(new BlobTransfer(host, { stalledAttempts: 2 }).push(HASH)).rejects.toThrow(
      'connection reset',
    );
  });

  it('treats a hash mismatch from the receiver as terminal', async () => {
    const { host, state } = createHost({
      async pushChunk(hash, { offset, length }) {
        state.calls.push(`pushChunk:${hash}@${offset}+${length}`);
        throw new BlobHashMismatchError('content does not match its hash');
      },
    });
    state.held.set(HASH, 120);

    await expect(new BlobTransfer(host).push(HASH)).rejects.toBeInstanceOf(BlobHashMismatchError);
    expect(pushCalls(state)).toHaveLength(1);
  });

  it('treats a refusal from the receiver as terminal', async () => {
    const { host, state } = createHost({
      async pushChunk(hash, { offset, length }) {
        state.calls.push(`pushChunk:${hash}@${offset}+${length}`);
        throw new ForbiddenError('blob not in scope');
      },
    });
    state.held.set(HASH, 120);

    await expect(new BlobTransfer(host).push(HASH)).rejects.toBeInstanceOf(ForbiddenError);
    expect(pushCalls(state)).toHaveLength(1);
  });

  it('completes a zero-byte blob with one empty delivery', async () => {
    const { host, state } = createHost();
    state.held.set(HASH, 0);

    await new BlobTransfer(host).push(HASH);

    expect(pushCalls(state)).toEqual([`pushChunk:${HASH}@0+0`]);
  });

  it('errors when every byte is delivered without an acknowledgement', async () => {
    const { host, state } = createHost({
      async offer(hash, { size }) {
        state.calls.push(`offer:${hash}:${size}`);
        return { status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 };
      },
      async pushChunk(hash, { offset, length }) {
        state.calls.push(`pushChunk:${hash}@${offset}+${length}`);
        return { acknowledged: false, receivedBytes: offset + length };
      },
    });
    state.held.set(HASH, 120);

    await expect(new BlobTransfer(host, { stalledAttempts: 2 }).push(HASH)).rejects.toThrow(
      'without acknowledgement',
    );
  });

  it('refuses to push content not held locally', async () => {
    const { host } = createHost();

    await expect(new BlobTransfer(host).push(HASH)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('availability', () => {
  it('reports bytes held locally as available', async () => {
    const { host, state } = createHost();
    state.held.set(HASH, 120);

    expect(await new BlobTransfer(host).availability(HASH)).toEqual({
      availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
      size: 120,
    });
  });

  it('reports bytes only the source holds as awaiting fetch', async () => {
    const { host, state } = createHost();
    state.remote.set(HASH, 120);

    expect(await new BlobTransfer(host).availability(HASH)).toEqual({
      availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH,
      size: 120,
    });
  });

  it('reports bytes neither holds as awaiting upload', async () => {
    const { host } = createHost();

    expect(await new BlobTransfer(host).availability(HASH)).toEqual({
      availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
    });
  });
});

describe('totalSizeFromHeaders', () => {
  it('takes the total from content-range', () => {
    expect(
      totalSizeFromHeaders({ contentRange: 'bytes 40-119/120', contentLength: '80', offset: 40 }),
    ).toBe(120);
  });

  it('falls back to content-length relative to the offset', () => {
    expect(totalSizeFromHeaders({ contentRange: null, contentLength: '80', offset: 40 })).toBe(120);
  });

  it('is undefined when neither header is present', () => {
    expect(totalSizeFromHeaders({ contentRange: null, contentLength: null, offset: 0 })).toBe(
      undefined,
    );
  });
});
