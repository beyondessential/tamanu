import { describe, expect, it } from 'vitest';

import { BlobOutbox } from '../src/outbox';
import type { BlobOutboxHost } from '../src/outbox';

interface OutboxState {
  outbox: string[];
  pushed: string[];
  demoted: string[];
  warnings: string[];
}

function createHost(overrides: Partial<BlobOutboxHost> = {}) {
  const state: OutboxState = { outbox: [], pushed: [], demoted: [], warnings: [] };

  const host: BlobOutboxHost = {
    async listOutbox(limit) {
      return state.outbox.slice(0, limit);
    },
    async push(hash) {
      state.pushed.push(hash);
      return { acknowledged: true };
    },
    async demote(hash) {
      state.demoted.push(hash);
    },
    onWarning(message) {
      state.warnings.push(message);
    },
    ...overrides,
  };

  return { host, state };
}

const resolveAll = async (hashes: string[]) => hashes;

describe('outbox pass', () => {
  it('offers eligible blobs oldest-first', async () => {
    const { host, state } = createHost();
    state.outbox = ['a', 'b', 'c'];

    const counts = await new BlobOutbox(host, { resolvers: [resolveAll] }).runOnce();

    expect(state.pushed).toEqual(['a', 'b', 'c']);
    expect(counts.pushed).toBe(3);
  });

  it('skips an ineligible blob without offering it', async () => {
    const { host, state } = createHost();
    state.outbox = ['a', 'b'];

    const counts = await new BlobOutbox(host, {
      resolvers: [async () => ['b']],
    }).runOnce();

    expect(state.pushed).toEqual(['b']);
    expect(counts.ineligible).toBe(1);
  });

  it('does not offer a blob whose transfer is already in flight', async () => {
    let release: () => void = () => {};
    const started = new Promise<void>(resolve => {
      release = resolve;
    });
    const { host, state } = createHost({
      async push(hash) {
        state.pushed.push(hash);
        await started;
        return { acknowledged: true };
      },
    });
    state.outbox = ['a'];

    const outbox = new BlobOutbox(host, { resolvers: [resolveAll] });
    const first = outbox.runOnce();
    const concurrent = await outbox.runOnce();
    release();
    await first;

    expect(concurrent.inFlight).toBe(1);
    expect(state.pushed).toEqual(['a']);
  });

  it('does not let a failed push block the blobs behind it', async () => {
    const { host, state } = createHost({
      async push(hash) {
        state.pushed.push(hash);
        if (hash === 'a') {
          throw new Error('refused');
        }
        return { acknowledged: true };
      },
    });
    state.outbox = ['a', 'b'];

    const counts = await new BlobOutbox(host, { resolvers: [resolveAll] }).runOnce();

    expect(state.pushed).toEqual(['a', 'b']);
    expect(counts).toMatchObject({ failed: 1, pushed: 1 });
  });

  it('demotes an acknowledged blob to cache', async () => {
    const { host, state } = createHost();
    state.outbox = ['a'];

    await new BlobOutbox(host, { resolvers: [resolveAll] }).runOnce();

    expect(state.demoted).toEqual(['a']);
  });

  it('re-demotes on a later pass when the demotion failed', async () => {
    let demotions = 0;
    const { host, state } = createHost({
      async demote(hash) {
        demotions += 1;
        if (demotions === 1) {
          throw new Error('registry unavailable');
        }
        state.demoted.push(hash);
      },
    });
    state.outbox = ['a'];

    const outbox = new BlobOutbox(host, { resolvers: [resolveAll] });
    const first = await outbox.runOnce();
    const second = await outbox.runOnce();

    expect(first.pushed).toBe(1);
    expect(state.demoted).toEqual(['a']);
    expect(second.pushed).toBe(1);
  });

  it('counts a push that returns without acknowledgement as skipped', async () => {
    const { host, state } = createHost({
      async push(hash) {
        state.pushed.push(hash);
        return { acknowledged: false };
      },
    });
    state.outbox = ['a'];

    const counts = await new BlobOutbox(host, { resolvers: [resolveAll] }).runOnce();

    expect(counts).toMatchObject({ skipped: 1, pushed: 0 });
    expect(state.demoted).toEqual([]);
  });
});

describe('eligibility', () => {
  it('does not let a failing resolver starve the other consumers', async () => {
    const { host, state } = createHost();
    state.outbox = ['a', 'b'];

    const counts = await new BlobOutbox(host, {
      resolvers: [
        async () => {
          throw new Error('schema mismatch');
        },
        async () => ['b'],
      ],
    }).runOnce();

    expect(state.pushed).toEqual(['b']);
    expect(counts.ineligible).toBe(1);
    expect(state.warnings).toContain('a reference resolver failed, skipping it this pass');
  });

  it('treats nothing as eligible when no resolvers are registered', async () => {
    const { host, state } = createHost();
    state.outbox = ['a', 'b'];

    const counts = await new BlobOutbox(host).runOnce();

    expect(state.pushed).toEqual([]);
    expect(counts.ineligible).toBe(2);
  });

  it('asks no resolver about an empty outbox', async () => {
    const { host } = createHost();
    let asked = false;

    const counts = await new BlobOutbox(host, {
      resolvers: [
        async hashes => {
          asked = true;
          return hashes;
        },
      ],
    }).runOnce();

    expect(asked).toBe(false);
    expect(counts).toMatchObject({ pushed: 0, ineligible: 0 });
  });
});
