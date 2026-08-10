import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CENTRAL_PARITY_TIERS, PARITY_SIDECAR_SUFFIX } from '@tamanu/blobs';

import { BLOB_FAULTS, BlobScrubber } from '../../src/blobStore/BlobScrubber';
import { BlobStore } from '../../src/blobStore/BlobStore';
import type { Blob } from '../../src/models/Blob';

const HELLO_HASH = 'sha256:b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

interface FakeRow {
  id: string;
  hash: string;
  size: number;
  integrityState: string;
  tier: string;
  lastScrubbedAt: Date | null;
  createdAt: Date;
  hasParity: boolean;
}

// In-memory Blob registry covering what the store and the scrubber ask of it:
// findOne, findAll with the least-recently-scrubbed ordering, update, destroy,
// and the raw upsert.
function makeFakeBlobModel() {
  const rows = new Map<string, FakeRow>();
  let inserted = 0;

  const matches = (row: FakeRow, where: Record<string, unknown> = {}) =>
    Object.entries(where).every(([field, expected]) => {
      const value = row[field as keyof FakeRow];
      // An array value is an IN check (the batched existence lookup).
      if (Array.isArray(expected)) {
        return expected.includes(value);
      }
      if (expected && typeof expected === 'object') {
        // The store and scrubber use Op.ne (a scalar) and Op.notIn (an array);
        // flatten both to the set of excluded values.
        const excluded = Object.getOwnPropertySymbols(expected)
          .map(symbol => (expected as Record<symbol, unknown>)[symbol])
          .flat();
        return !excluded.includes(value);
      }
      return value === expected;
    });

  return {
    rows,
    async findOne({ where }: { where: Record<string, unknown> }) {
      return [...rows.values()].find(row => matches(row, where)) ?? null;
    },
    async findAll({ where, limit }: { where?: Record<string, unknown>; limit?: number } = {}) {
      const found = [...rows.values()]
        .filter(row => matches(row, where))
        // Mirrors the scrubber's order: never-scrubbed first, then oldest scrub,
        // then oldest row.
        .sort((a, b) => {
          const left = a.lastScrubbedAt?.getTime() ?? -Infinity;
          const right = b.lastScrubbedAt?.getTime() ?? -Infinity;
          return left - right || a.createdAt.getTime() - b.createdAt.getTime();
        });
      return limit === undefined ? found : found.slice(0, limit);
    },
    async update(values: Partial<FakeRow>, { where }: { where: Record<string, unknown> }) {
      for (const row of rows.values()) {
        if (matches(row, where)) {
          Object.assign(row, values);
        }
      }
    },
    async destroy({ where: { hash } }: { where: { hash: string } }) {
      rows.delete(hash as string);
    },
    sequelize: {
      async query(
        _sql: string,
        { bind }: { bind: { id: string; hash: string; size: number; integrityState: string; tier: string } },
      ) {
        if (!rows.has(bind.hash)) {
          inserted += 1;
          rows.set(bind.hash, {
            id: bind.id,
            hash: bind.hash,
            size: bind.size,
            integrityState: bind.integrityState,
            tier: bind.tier,
            lastScrubbedAt: new Date(),
            // Distinct and increasing, so createdAt is a stable tiebreak.
            createdAt: new Date(inserted * 1000),
            hasParity: false,
          });
        }
      },
    },
  };
}

describe('BlobScrubber', () => {
  let root: string;
  let fakeBlob: ReturnType<typeof makeFakeBlobModel>;
  let store: BlobStore;
  let healed: Array<{ hash: string; fault: string; tier?: string }>;

  const makeScrubber = ({
    maxBlobs = 100,
    maxBytes = 1_000_000,
    findUndeliverableReferences,
    heal,
    blobStore = store,
  }: {
    maxBlobs?: number;
    maxBytes?: number;
    findUndeliverableReferences?: (limit: number) => Promise<string[]>;
    heal?: (report: { hash: string; fault: string }) => Promise<void>;
    blobStore?: BlobStore;
  } = {}) =>
    new BlobScrubber({
      blobStore,
      models: { Blob: fakeBlob as unknown as typeof Blob },
      getLimits: async () => ({ maxBlobs, maxBytes }),
      heal:
        heal ??
        (async ({ hash, fault, blob }) => {
          healed.push({ hash, fault, tier: blob?.tier });
        }),
      findUndeliverableReferences,
      log: { info: () => {}, warn: () => {} },
    });

  // spec: FEC — a store with error correction switched on, for the retrofit pass.
  const makeParityStore = ({ enabled = true } = {}) =>
    new BlobStore({
      root,
      models: { Blob: fakeBlob as unknown as typeof Blob },
      getFreeDiskReserveBytes: async () => 0,
      statfs: async () => ({ bavail: 1_000_000_000, bsize: 1 }),
      errorCorrection: {
        coveredTiers: CENTRAL_PARITY_TIERS,
        getSettings: async () => ({ enabled, proportion: 0.1 }),
      },
      log: { error: () => {}, warn: () => {} },
    });

  const corruptStoredBytes = async (hash: string, replacement: string) => {
    const digest = hash.split(':')[1];
    await fs.writeFile(
      path.join(root, 'sha256', digest.slice(0, 2), digest.slice(2, 4), digest.slice(4)),
      replacement,
    );
  };

  const removeStoredBytes = async (hash: string) => {
    const digest = hash.split(':')[1];
    await fs.rm(
      path.join(root, 'sha256', digest.slice(0, 2), digest.slice(2, 4), digest.slice(4)),
      { force: true },
    );
  };

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-scrubber-test-'));
    fakeBlob = makeFakeBlobModel();
    healed = [];
    store = new BlobStore({
      root,
      models: { Blob: fakeBlob as unknown as typeof Blob },
      getFreeDiskReserveBytes: async () => 0,
      statfs: async () => ({ bavail: 1_000_000, bsize: 1 }),
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  describe('verification pass', () => {
    it('verifies stored blobs and records when it did', async () => {
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      fakeBlob.rows.get(hash)!.lastScrubbedAt = null;

      const result = await makeScrubber().run();

      expect(result.verified).toBe(1);
      expect(result.faults).toBe(0);
      expect(fakeBlob.rows.get(hash)!.lastScrubbedAt).toBeInstanceOf(Date);
    });

    it('stamps a whole batch of verified blobs in a single write', async () => {
      for (let i = 0; i < 5; i++) {
        await store.put(Readable.from(Buffer.from(`verified content ${i}`)));
      }
      const calls: string[][] = [];
      const original = store.recordVerified.bind(store);
      store.recordVerified = async hashes => {
        calls.push(hashes);
        return original(hashes);
      };

      const result = await makeScrubber().run();

      expect(result.verified).toBe(5);
      // One stamp call carrying all five, not one write per blob.
      const stampCalls = calls.filter(hashes => hashes.length > 0);
      expect(stampCalls).toHaveLength(1);
      expect(stampCalls[0]).toHaveLength(5);
    });

    it('leaves a blob quarantined mid-pass quarantined, not stamped verified by the flush', async () => {
      // Two intact blobs, so the first has verified and is sitting in the
      // pending batch while the second is still being read.
      const { hash: first } = await store.put(Readable.from(Buffer.from('first content')));
      const { hash: second } = await store.put(Readable.from(Buffer.from('second content')));
      const original = store.verify.bind(store);
      store.verify = async hash => {
        const outcome = await original(hash);
        if (hash === second) {
          // A read-path corruption on the first blob lands between its verify()
          // and the end-of-pass flush.
          fakeBlob.rows.get(first)!.integrityState = 'quarantined';
        }
        return outcome;
      };

      await makeScrubber().run();

      expect(fakeBlob.rows.get(first)!.integrityState).toBe('quarantined');
      expect(fakeBlob.rows.get(second)!.integrityState).toBe('verified');
    });

    it('reports content whose bytes no longer match its hash as corrupt', async () => {
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      await corruptStoredBytes(hash, 'goodbye wo');

      const result = await makeScrubber().run();

      expect(result.faults).toBe(1);
      expect(healed).toEqual([{ hash, fault: BLOB_FAULTS.CORRUPT, tier: 'cache' }]);
    });

    it('reports a registry entry whose bytes are gone as missing', async () => {
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      await removeStoredBytes(hash);

      const result = await makeScrubber().run();

      expect(result.faults).toBe(1);
      expect(healed).toEqual([{ hash, fault: BLOB_FAULTS.MISSING, tier: 'cache' }]);
    });

    it('passes the registry row through, so the healer can grade on tier', async () => {
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')), {
        tier: 'outbox',
      });
      await corruptStoredBytes(hash, 'goodbye wo');

      await makeScrubber().run();

      expect(healed).toEqual([{ hash, fault: BLOB_FAULTS.CORRUPT, tier: 'outbox' }]);
    });

    it('leaves an already-quarantined blob alone rather than re-reporting it each pass', async () => {
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      await corruptStoredBytes(hash, 'goodbye wo');
      fakeBlob.rows.get(hash)!.integrityState = 'quarantined';

      const result = await makeScrubber().run();

      expect(result.faults).toBe(0);
      expect(healed).toEqual([]);
    });

    it('re-checks an absent blob without re-reporting it while it stays missing', async () => {
      // A registry row whose bytes are gone, recorded absent by an earlier pass.
      // The scrub still looks at it (that is how it would notice recovery) but
      // does not re-escalate or re-heal, and re-stamps it so it yields its slot.
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      await removeStoredBytes(hash);
      fakeBlob.rows.get(hash)!.integrityState = 'absent';
      fakeBlob.rows.get(hash)!.lastScrubbedAt = new Date(1000);

      const result = await makeScrubber().run();

      expect(result.faults).toBe(0);
      expect(healed).toEqual([]);
      expect(fakeBlob.rows.get(hash)!.integrityState).toBe('absent');
      expect(fakeBlob.rows.get(hash)!.lastScrubbedAt!.getTime()).toBeGreaterThan(1000);
    });

    it('restores an absent blob to verified once its bytes return', async () => {
      // The bytes come back (e.g. a backup restore drops the file into place)
      // while the registry row still stands absent; the scrub flips it back.
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      fakeBlob.rows.get(hash)!.integrityState = 'absent';

      const result = await makeScrubber().run();

      expect(result.faults).toBe(0);
      expect(result.verified).toBe(1);
      expect(fakeBlob.rows.get(hash)!.integrityState).toBe('verified');
    });

    it('takes least-recently-scrubbed blobs first', async () => {
      const stale = await store.put(Readable.from(Buffer.from('stale content')));
      const fresh = await store.put(Readable.from(Buffer.from('fresh content')));
      fakeBlob.rows.get(stale.hash)!.lastScrubbedAt = new Date(1000);
      fakeBlob.rows.get(fresh.hash)!.lastScrubbedAt = new Date(9000);

      const result = await makeScrubber({ maxBlobs: 1 }).run();

      expect(result.verified).toBe(1);
      expect(fakeBlob.rows.get(stale.hash)!.lastScrubbedAt!.getTime()).toBeGreaterThan(1000);
      expect(fakeBlob.rows.get(fresh.hash)!.lastScrubbedAt!.getTime()).toBe(9000);
    });

    it('takes a never-scrubbed blob ahead of a stale one', async () => {
      const stale = await store.put(Readable.from(Buffer.from('stale content')));
      const never = await store.put(Readable.from(Buffer.from('never scrubbed')));
      fakeBlob.rows.get(stale.hash)!.lastScrubbedAt = new Date(1000);
      fakeBlob.rows.get(never.hash)!.lastScrubbedAt = null;

      await makeScrubber({ maxBlobs: 1 }).run();

      expect(fakeBlob.rows.get(never.hash)!.lastScrubbedAt).toBeInstanceOf(Date);
      expect(fakeBlob.rows.get(stale.hash)!.lastScrubbedAt!.getTime()).toBe(1000);
    });

    it('stops on the byte limit so one pass cannot read the whole store', async () => {
      await store.put(Readable.from(Buffer.from('a'.repeat(50))));
      await store.put(Readable.from(Buffer.from('b'.repeat(50))));
      await store.put(Readable.from(Buffer.from('c'.repeat(50))));

      const result = await makeScrubber({ maxBytes: 60 }).run();

      expect(result.verified).toBe(2);
      expect(result.ratelimited).toBe(true);
    });

    it('carries on past a blob the healer cannot fix', async () => {
      const first = await store.put(Readable.from(Buffer.from('first content')));
      const second = await store.put(Readable.from(Buffer.from('second content')));
      await corruptStoredBytes(first.hash, 'x'.repeat(13));
      await corruptStoredBytes(second.hash, 'y'.repeat(14));

      const result = await makeScrubber({
        heal: async () => {
          throw new Error('healer unavailable');
        },
      }).run();

      expect(result.faults).toBe(2);
    });
  });

  describe('reconciliation pass', () => {
    it('registers bytes on disk that no registry entry names', async () => {
      const { hash, size } = await store.put(Readable.from(Buffer.from('hello world')));
      fakeBlob.rows.clear();

      const result = await makeScrubber().run();

      expect(result.adopted).toBe(1);
      expect(fakeBlob.rows.get(hash)).toMatchObject({ hash, size, integrityState: 'verified' });
    });

    it('quarantines unregistered bytes that do not match the hash their location encodes', async () => {
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      await corruptStoredBytes(hash, 'goodbye wo');
      fakeBlob.rows.clear();

      const result = await makeScrubber().run();

      expect(result.adopted).toBe(0);
      expect(result.faults).toBe(1);
      expect(fakeBlob.rows.get(hash)!.integrityState).toBe('quarantined');
      expect(healed).toEqual([{ hash, fault: BLOB_FAULTS.CORRUPT, tier: 'cache' }]);
    });

    it('leaves registered content alone', async () => {
      await store.put(Readable.from(Buffer.from('hello world')));

      const result = await makeScrubber().run();

      expect(result.adopted).toBe(0);
      expect(result.faults).toBe(0);
    });

    it('partitions a batch of stored hashes into registered and orphan', async () => {
      // A registered blob and two orphans interleaved: the batched existence
      // check must reconcile only the orphans and leave the registered one.
      const registered = await store.put(Readable.from(Buffer.from('registered content')));
      const orphanA = await store.put(Readable.from(Buffer.from('orphan a')));
      const orphanB = await store.put(Readable.from(Buffer.from('orphan b')));
      fakeBlob.rows.delete(orphanA.hash);
      fakeBlob.rows.delete(orphanB.hash);

      const result = await makeScrubber().run();

      expect(result.adopted).toBe(2);
      expect(fakeBlob.rows.get(orphanA.hash)!.integrityState).toBe('verified');
      expect(fakeBlob.rows.get(orphanB.hash)!.integrityState).toBe('verified');
      // The registered blob was verified by the verification pass, not adopted.
      expect(fakeBlob.rows.get(registered.hash)!.integrityState).toBe('verified');
    });

    it('stops reconciling orphans on the blob limit, leaving the rest for a later pass', async () => {
      const orphans = [];
      for (let i = 0; i < 3; i++) {
        orphans.push((await store.put(Readable.from(Buffer.from(`orphan ${i}`)))).hash);
      }
      fakeBlob.rows.clear();

      const result = await makeScrubber({ maxBlobs: 2 }).run();

      // Two adopted this pass; the third stays unregistered on disk and is found
      // again next pass, so coverage is not lost.
      expect(result.adopted).toBe(2);
      expect(result.ratelimited).toBe(true);
      const stillOrphan = orphans.filter(hash => !fakeBlob.rows.has(hash));
      expect(stillOrphan).toHaveLength(1);
    });
  });

  describe('referential pass', () => {
    it('reports content that must be durably present but is not held at all', async () => {
      const result = await makeScrubber({
        findUndeliverableReferences: async () => [HELLO_HASH],
      }).run();

      expect(result.faults).toBe(1);
      expect(healed).toEqual([
        { hash: HELLO_HASH, fault: BLOB_FAULTS.MISSING, tier: undefined },
      ]);
    });

    it('is skipped where the server supplies no reference check', async () => {
      const result = await makeScrubber().run();
      expect(result.faults).toBe(0);
    });
  });
  // spec: FEC
  describe('parity pass', () => {
    // A blob big enough to be covered: below the size floor parity is skipped.
    const covered = Buffer.alloc(64 * 1024, 'c');
    const sidecarOf = (hash: string) => {
      const digest = hash.split(':')[1];
      return path.join(
        root,
        'sha256',
        digest.slice(0, 2),
        digest.slice(2, 4),
        `${digest.slice(4)}${PARITY_SIDECAR_SUFFIX}`,
      );
    };

    it('brings a store that predates error correction under protection', async () => {
      // Admitted with error correction off, so the content is stored unprotected.
      const { hash } = await makeParityStore({ enabled: false }).put(Readable.from(covered));
      await expect(fs.access(sidecarOf(hash))).rejects.toThrow();

      // Switched on: the scrub retrofits what is already stored.
      const result = await makeScrubber({ blobStore: makeParityStore() }).run();

      expect(result.protected).toBe(1);
      await expect(fs.access(sidecarOf(hash))).resolves.toBeUndefined();
      expect(fakeBlob.rows.get(hash)!.hasParity).toBe(true);
    });

    it('does nothing on a second pass, having nothing left to protect', async () => {
      const enabled = makeParityStore();
      await enabled.put(Readable.from(covered));

      expect((await makeScrubber({ blobStore: enabled }).run()).protected).toBe(0);
    });

    it('writes no parity while error correction is off', async () => {
      const disabled = makeParityStore({ enabled: false });
      const { hash } = await disabled.put(Readable.from(covered));

      const result = await makeScrubber({ blobStore: disabled }).run();

      expect(result.protected).toBe(0);
      await expect(fs.access(sidecarOf(hash))).rejects.toThrow();
    });

    it('skips a blob the size floor excludes', async () => {
      await makeParityStore({ enabled: false }).put(
        Readable.from(Buffer.from('too small to be worth protecting')),
      );

      expect((await makeScrubber({ blobStore: makeParityStore() }).run()).protected).toBe(0);
    });

    it('does not protect a blob whose bytes no longer match its hash', async () => {
      const { hash } = await makeParityStore({ enabled: false }).put(Readable.from(covered));
      await corruptStoredBytes(hash, 'rotted');

      const result = await makeScrubber({ blobStore: makeParityStore() }).run();

      // The verification pass owns the fault; parity is never computed over bytes
      // that would protect the corruption instead of the content.
      expect(result.protected).toBe(0);
      expect(result.faults).toBe(1);
      await expect(fs.access(sidecarOf(hash))).rejects.toThrow();
    });

    it('stops at the byte budget and picks the rest up next pass', async () => {
      const disabled = makeParityStore({ enabled: false });
      for (let index = 0; index < 3; index++) {
        await disabled.put(Readable.from(Buffer.alloc(64 * 1024, `p${index}`)));
      }

      // Enough for one blob's verify-then-encode, not for three.
      const result = await makeScrubber({
        blobStore: makeParityStore(),
        maxBytes: 64 * 1024,
      }).run();

      expect(result.protected).toBe(1);
      expect(result.ratelimited).toBe(true);
      expect([...fakeBlob.rows.values()].filter(row => row.hasParity)).toHaveLength(1);
    });
  });
});
