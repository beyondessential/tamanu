import { describe, expect, it } from 'vitest';

import { BLOB_INTEGRITY_STATES, BLOB_TIERS } from '@tamanu/constants';
import { BlobHashMismatchError, InsufficientStorageError, NotFoundError } from '@tamanu/errors';

import { BlobAdmission, type BlobAdmissionHost } from '../src/admission';

// Content is identified by what the fake hasher says the file holds: a test
// writes `files[path] = 'abc'` and the file hashes to `sha256:abc000…`, padded
// to the digest width a real sha256 hash has.
const digestOf = (content: string) => content.padEnd(64, '0');
const hashOf = (content: string) => `sha256:${digestOf(content)}`;
const ABC = hashOf('abc');
interface AdmissionState {
  files: Map<string, string>;
  registry: Map<string, { size: number; tier: string; integrityState?: string }>;
  free: number;
  reserve: number;
  calls: string[];
}

function createHost(overrides: Partial<BlobAdmissionHost> = {}) {
  const state: AdmissionState = {
    files: new Map(),
    registry: new Map(),
    free: 1_000_000,
    reserve: 0,
    calls: [],
  };

  const host: BlobAdmissionHost = {
    async hashFile(path) {
      state.calls.push(`hashFile:${path}`);
      const content = state.files.get(path);
      if (content === undefined) {
        throw new Error(`no such file ${path}`);
      }
      return digestOf(content);
    },
    async fileExists(path) {
      return state.files.has(path);
    },
    async fileSize(path) {
      return (state.files.get(path) ?? '').length;
    },
    async place(fromPath, toPath) {
      state.calls.push(`place:${fromPath}->${toPath}`);
      state.files.set(toPath, state.files.get(fromPath)!);
      state.files.delete(fromPath);
    },
    async removeFile(path) {
      state.calls.push(`removeFile:${path}`);
      state.files.delete(path);
    },
    pathFor(hash) {
      return `store/${hash}`;
    },
    stagingPathFor(hash) {
      return `staging/${hash}`;
    },
    async stat(hash) {
      const row = state.registry.get(hash);
      // Bytes gone means nothing held, however the row still reads.
      return row && state.files.has(`store/${hash}`)
        ? { size: row.size, ...(row.integrityState ? { integrityState: row.integrityState } : {}) }
        : null;
    },
    async markVerified(hash, size) {
      state.calls.push(`markVerified:${hash}`);
      const row = state.registry.get(hash);
      if (row && row.integrityState !== BLOB_INTEGRITY_STATES.VERIFIED) {
        state.registry.set(hash, { ...row, size, integrityState: BLOB_INTEGRITY_STATES.VERIFIED });
      }
    },
    async register(hash, size, tier) {
      state.calls.push(`register:${hash}`);
      // Contract: a live row is left alone; this fake has no soft deletes.
      if (!state.registry.has(hash)) {
        state.registry.set(hash, { size, tier });
      }
    },
    async storage() {
      return { free: state.free, reserve: state.reserve };
    },
    ...overrides,
  };

  return { host, state };
}

describe('admitting written content', () => {
  it('places content at its fan-out path before registering it', async () => {
    const { host, state } = createHost();
    state.files.set('tmp/1', 'abc');

    const result = await new BlobAdmission(host).admitFile('tmp/1');

    expect(state.calls).toEqual([
      'hashFile:tmp/1',
      `place:tmp/1->store/${ABC}`,
      `register:${ABC}`,
    ]);
    expect(result).toEqual({ hash: ABC, size: 3, existed: false });
  });

  it('leaves an adoptable orphan when registration fails after placement', async () => {
    let registrations = 0;
    const { host, state } = createHost({
      async register(hash, size, tier) {
        registrations += 1;
        state.calls.push(`register:${hash}`);
        if (registrations === 1) {
          throw new Error('registry unavailable');
        }
        state.registry.set(hash, { size, tier });
      },
    });
    state.files.set('tmp/1', 'abc');

    await expect(new BlobAdmission(host).admitFile('tmp/1')).rejects.toThrow(
      'registry unavailable',
    );
    expect(state.files.has(`store/${ABC}`)).toBe(true);
    expect(state.registry.has(ABC)).toBe(false);

    // The orphan is adopted rather than re-placed by the next admission.
    state.files.set('tmp/2', 'abc');
    const result = await new BlobAdmission(host).admitFile('tmp/2');

    expect(result.existed).toBe(true);
    expect(state.registry.get(ABC)).toBeDefined();
  });

  it('shares the stored blob when the content is already held', async () => {
    const { host, state } = createHost();
    state.files.set(`store/${ABC}`, 'abc');
    state.registry.set(ABC, { size: 3, tier: BLOB_TIERS.OUTBOX });
    state.files.set('tmp/1', 'abc');

    const result = await new BlobAdmission(host).admitFile('tmp/1', { tier: BLOB_TIERS.CACHE });

    expect(result).toEqual({ hash: ABC, size: 3, existed: true });
    expect(state.calls).toContain('removeFile:tmp/1');
    expect(state.calls).not.toContain(`place:tmp/1->store/${ABC}`);
    // The live row keeps its tier: the register call is a no-op against it.
    expect(state.registry.get(ABC)?.tier).toBe(BLOB_TIERS.OUTBOX);
  });

  it('records the tier the caller admitted with', async () => {
    const { host, state } = createHost();
    state.files.set('tmp/1', 'abc');

    await new BlobAdmission(host).admitFile('tmp/1', { tier: BLOB_TIERS.OUTBOX });

    expect(state.registry.get(ABC)?.tier).toBe(BLOB_TIERS.OUTBOX);
  });
});

describe('committing staged content', () => {
  it('verifies, places, then registers', async () => {
    const { host, state } = createHost();
    state.files.set(`staging/${ABC}`, 'abc');

    const result = await new BlobAdmission(host).commitStaged(ABC);

    expect(state.calls).toEqual([
      `hashFile:staging/${ABC}`,
      `place:staging/${ABC}->store/${ABC}`,
      `register:${ABC}`,
      // Fires on every commit; the host's own update leaves a verified row alone.
      `markVerified:${ABC}`,
    ]);
    expect(result).toEqual({ hash: ABC, size: 3, existed: false });
  });

  it('discards staging that hashes to something else', async () => {
    const { host, state } = createHost();
    state.files.set(`staging/${ABC}`, 'dec');

    await expect(new BlobAdmission(host).commitStaged(ABC)).rejects.toBeInstanceOf(
      BlobHashMismatchError,
    );
    expect(state.files.has(`staging/${ABC}`)).toBe(false);
    expect(state.registry.has(ABC)).toBe(false);
  });

  it('is a no-op that drops the staging when the content is already held', async () => {
    const { host, state } = createHost();
    state.files.set(`store/${ABC}`, 'abc');
    state.registry.set(ABC, { size: 3, tier: BLOB_TIERS.CACHE });
    state.files.set(`staging/${ABC}`, 'abc');

    const result = await new BlobAdmission(host).commitStaged(ABC);

    expect(result).toEqual({ hash: ABC, size: 3, existed: true });
    expect(state.files.has(`staging/${ABC}`)).toBe(false);
  });

  it('heals a row standing as absent, whose bytes had gone', async () => {
    const { host, state } = createHost();
    // The row survives, its bytes do not: what a refetch arrives to heal.
    state.registry.set(ABC, {
      size: 3,
      tier: BLOB_TIERS.CACHE,
      integrityState: BLOB_INTEGRITY_STATES.ABSENT,
    });
    state.files.set(`staging/${ABC}`, 'abc');

    const result = await new BlobAdmission(host).commitStaged(ABC);

    expect(result.existed).toBe(false);
    expect(state.calls).toContain(`markVerified:${ABC}`);
    expect(state.registry.get(ABC)?.integrityState).toBe(BLOB_INTEGRITY_STATES.VERIFIED);
  });

  it('heals a quarantined row by replacing its bytes', async () => {
    const { host, state } = createHost();
    state.files.set(`store/${ABC}`, 'dec');
    state.registry.set(ABC, {
      size: 3,
      tier: BLOB_TIERS.CACHE,
      integrityState: BLOB_INTEGRITY_STATES.QUARANTINED,
    });
    state.files.set(`staging/${ABC}`, 'abc');

    const result = await new BlobAdmission(host).commitStaged(ABC);

    expect(result.existed).toBe(false);
    expect(state.files.get(`store/${ABC}`)).toBe('abc');
    expect(state.registry.get(ABC)?.integrityState).toBe(BLOB_INTEGRITY_STATES.VERIFIED);
  });

  it('reports nothing staged rather than hashing a missing file', async () => {
    const { host } = createHost();

    await expect(new BlobAdmission(host).commitStaged(ABC)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('free-disk floor', () => {
  it('admits while the reserve is intact', async () => {
    const { host, state } = createHost();
    state.free = 1000;
    state.reserve = 500;

    await expect(new BlobAdmission(host).ensureFloor(100)).resolves.toBeUndefined();
  });

  it('refuses rather than cross into the reserve', async () => {
    const { host, state } = createHost();
    state.free = 600;
    state.reserve = 500;

    await expect(new BlobAdmission(host).ensureFloor(200)).rejects.toBeInstanceOf(
      InsufficientStorageError,
    );
  });

  it('asks the host to evict before refusing, and proceeds when that frees enough', async () => {
    const { host, state } = createHost({
      async evict(bytesNeeded) {
        state.calls.push(`evict:${bytesNeeded}`);
        state.free += bytesNeeded;
      },
    });
    state.free = 600;
    state.reserve = 500;

    await new BlobAdmission(host).ensureFloor(200);

    expect(state.calls).toEqual(['evict:100']);
  });

  it('still refuses when eviction did not free enough', async () => {
    const { host, state } = createHost({
      async evict() {
        state.calls.push('evict');
      },
    });
    state.free = 600;
    state.reserve = 500;

    await expect(new BlobAdmission(host).ensureFloor(200)).rejects.toBeInstanceOf(
      InsufficientStorageError,
    );
    expect(state.calls).toEqual(['evict']);
  });

  it('refuses an admission whose write already crossed the floor', async () => {
    const { host, state } = createHost();
    state.files.set('tmp/1', 'abc');
    state.free = 100;
    state.reserve = 500;

    await expect(new BlobAdmission(host).admitFile('tmp/1')).rejects.toBeInstanceOf(
      InsufficientStorageError,
    );
    expect(state.calls).toEqual([]);
  });
});
