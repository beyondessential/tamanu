import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
}

// In-memory Blob registry covering what the store and the scrubber ask of it:
// findOne, findAll with the least-recently-scrubbed ordering, update, destroy,
// and the raw upsert.
function makeFakeBlobModel() {
  const rows = new Map<string, FakeRow>();
  let inserted = 0;

  const matches = (row: FakeRow, where: Record<string, unknown> = {}) =>
    Object.entries(where).every(([field, expected]) => {
      if (expected && typeof expected === 'object') {
        const excluded = Object.getOwnPropertySymbols(expected).map(
          symbol => (expected as Record<symbol, unknown>)[symbol],
        );
        return !excluded.includes(row[field as keyof FakeRow]);
      }
      return row[field as keyof FakeRow] === expected;
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
  }: {
    maxBlobs?: number;
    maxBytes?: number;
    findUndeliverableReferences?: (limit: number) => Promise<string[]>;
    heal?: (report: { hash: string; fault: string }) => Promise<void>;
  } = {}) =>
    new BlobScrubber({
      blobStore: store,
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
});
