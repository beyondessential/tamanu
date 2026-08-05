import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InsufficientStorageError, NotFoundError } from '@tamanu/errors';

import { BlobStore } from '../../src/blobStore/BlobStore';
import type { Blob } from '../../src/models/Blob';

// SHA-256 of empty content, and of 'hello world'
const EMPTY_HASH = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const HELLO_HASH = 'sha256:b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

interface FakeRow {
  id: string;
  hash: string;
  size: number;
  integrityState: string;
}

// In-memory stand-in for the Blob registry model, covering the calls the
// store makes: findOne, destroy, and the raw upsert via sequelize.query.
function makeFakeBlobModel() {
  const rows = new Map<string, FakeRow>();
  return {
    rows,
    async findOne({ where: { hash } }: { where: { hash: string } }) {
      return rows.get(hash) ?? null;
    },
    async destroy({ where: { hash } }: { where: { hash: string } }) {
      rows.delete(hash);
    },
    sequelize: {
      async query(
        _sql: string,
        { bind }: { bind: { id: string; hash: string; size: number; integrityState: string } },
      ) {
        if (!rows.has(bind.hash)) {
          rows.set(bind.hash, {
            id: bind.id,
            hash: bind.hash,
            size: bind.size,
            integrityState: bind.integrityState,
          });
        }
      },
    },
  };
}

async function readAll(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

describe('BlobStore', () => {
  let root: string;
  let fakeBlob: ReturnType<typeof makeFakeBlobModel>;
  let volumeFreeBytes: number;

  const makeStore = ({
    reserveBytes = 0,
    evictCache,
  }: {
    reserveBytes?: number;
    evictCache?: (bytesNeeded: number) => Promise<void>;
  } = {}) =>
    new BlobStore({
      root,
      models: { Blob: fakeBlob as unknown as typeof Blob },
      getFreeDiskReserveBytes: async () => reserveBytes,
      evictCache,
      statfs: async () => ({ bavail: volumeFreeBytes, bsize: 1 }),
    });

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-store-test-'));
    fakeBlob = makeFakeBlobModel();
    volumeFreeBytes = 1_000_000;
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  describe('put', () => {
    it('stores content at the algorithm-namespaced fan-out path', async () => {
      const store = makeStore();
      const { hash, size, existed } = await store.put(Readable.from(Buffer.from('hello world')));

      expect(hash).toBe(HELLO_HASH);
      expect(size).toBe(11);
      expect(existed).toBe(false);

      const digest = hash.split(':')[1];
      const expectedPath = path.join(
        root,
        'sha256',
        digest.slice(0, 2),
        digest.slice(2, 4),
        digest.slice(4),
      );
      const stored = await fs.readFile(expectedPath);
      expect(stored.toString()).toBe('hello world');
    });

    it('registers the blob with its size and verified state', async () => {
      const store = makeStore();
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));

      const row = fakeBlob.rows.get(hash);
      expect(row).toMatchObject({ hash, size: 11, integrityState: 'verified' });
    });

    it('stores empty content like any other blob', async () => {
      const store = makeStore();
      const { hash, size } = await store.put(Readable.from(Buffer.alloc(0)));

      expect(hash).toBe(EMPTY_HASH);
      expect(size).toBe(0);
      expect(await store.has(hash)).toBe(true);
      expect(await readAll(await store.get(hash))).toHaveLength(0);
    });

    it('is a no-op for content that is already stored', async () => {
      const store = makeStore();
      const first = await store.put(Readable.from(Buffer.from('hello world')));
      const second = await store.put(Readable.from(Buffer.from('hello world')));

      expect(second.hash).toBe(first.hash);
      expect(second.existed).toBe(true);
      expect(fakeBlob.rows.size).toBe(1);
    });

    it('leaves no temporary file behind when the source stream fails', async () => {
      const store = makeStore();
      async function* failingSource() {
        yield Buffer.from('partial');
        throw new Error('upload aborted');
      }

      await expect(store.put(Readable.from(failingSource()))).rejects.toThrow('upload aborted');
      expect(await fs.readdir(path.join(root, 'tmp'))).toHaveLength(0);
    });

    it('adopts an orphan file left by a crash between placement and registration', async () => {
      const store = makeStore();
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      // simulate a crash after the rename but before the registry insert
      fakeBlob.rows.clear();

      const again = await store.put(Readable.from(Buffer.from('hello world')));

      expect(again.existed).toBe(true);
      expect(fakeBlob.rows.get(hash)).toMatchObject({ hash, size: 11 });
      expect(await store.has(hash)).toBe(true);
    });
  });

  describe('get', () => {
    it('streams stored content by hash', async () => {
      const store = makeStore();
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));

      const content = await readAll(await store.get(hash));
      expect(content.toString()).toBe('hello world');
    });

    it('throws NotFoundError for an absent blob', async () => {
      const store = makeStore();
      await expect(store.get(EMPTY_HASH)).rejects.toThrow(NotFoundError);
    });

    it('never serves a quarantined blob', async () => {
      const store = makeStore();
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      fakeBlob.rows.get(hash)!.integrityState = 'quarantined';

      await expect(store.get(hash)).rejects.toThrow(NotFoundError);
    });

    it('never serves bytes with no registry row', async () => {
      const store = makeStore();
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      fakeBlob.rows.clear();

      await expect(store.get(hash)).rejects.toThrow(NotFoundError);
    });

    it('rejects a malformed hash', async () => {
      const store = makeStore();
      await expect(store.get('not-a-hash')).rejects.toThrow(/algorithm-tagged/);
    });
  });

  describe('has', () => {
    it('reports presence only when both registry row and file exist', async () => {
      const store = makeStore();
      expect(await store.has(HELLO_HASH)).toBe(false);

      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      expect(await store.has(hash)).toBe(true);

      // registry row without bytes on disk is not usable content
      await fs.rm(path.join(root, 'sha256'), { recursive: true, force: true });
      expect(await store.has(hash)).toBe(false);
    });

    it('reports a quarantined blob as present', async () => {
      // presence, not servability: get refuses the same blob
      const store = makeStore();
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      fakeBlob.rows.get(hash)!.integrityState = 'quarantined';

      expect(await store.has(hash)).toBe(true);
    });

    it('rejects a malformed hash', async () => {
      const store = makeStore();
      await expect(store.has('not-a-hash')).rejects.toThrow(/algorithm-tagged/);
    });
  });

  describe('delete', () => {
    it('removes the file and the registry row', async () => {
      const store = makeStore();
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));

      await store.delete(hash);

      expect(await store.has(hash)).toBe(false);
      expect(fakeBlob.rows.size).toBe(0);
      await expect(store.get(hash)).rejects.toThrow(NotFoundError);
    });

    it('is a no-op for an absent blob', async () => {
      const store = makeStore();
      await expect(store.delete(HELLO_HASH)).resolves.toBeUndefined();
    });

    it('rejects a malformed hash', async () => {
      const store = makeStore();
      await expect(store.delete('not-a-hash')).rejects.toThrow(/algorithm-tagged/);
    });
  });

  describe('free-disk floor', () => {
    it('refuses new content rather than cross into the reserve', async () => {
      volumeFreeBytes = 100;
      const store = makeStore({ reserveBytes: 1000 });

      const source = Readable.from(Buffer.from('hello world'));
      await expect(store.put(source)).rejects.toThrow(InsufficientStorageError);
      expect(source.destroyed).toBe(true);
      expect(fakeBlob.rows.size).toBe(0);
      expect(await fs.readdir(path.join(root, 'tmp'))).toHaveLength(0);
    });

    it('evicts cache before refusing', async () => {
      volumeFreeBytes = 100;
      const evictCache = vi.fn(async (bytesNeeded: number) => {
        expect(bytesNeeded).toBeGreaterThan(0);
        volumeFreeBytes = 10_000;
      });
      const store = makeStore({ reserveBytes: 1000, evictCache });

      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      expect(evictCache).toHaveBeenCalled();
      expect(await store.has(hash)).toBe(true);
    });

    it('refuses when eviction cannot free enough space', async () => {
      volumeFreeBytes = 100;
      const evictCache = vi.fn(async () => {
        volumeFreeBytes = 150;
      });
      const store = makeStore({ reserveBytes: 1000, evictCache });

      await expect(store.put(Readable.from(Buffer.from('hello world')))).rejects.toThrow(
        InsufficientStorageError,
      );
      expect(evictCache).toHaveBeenCalled();
    });

    it('refuses up front when a size hint already breaches the reserve', async () => {
      volumeFreeBytes = 1000;
      const store = makeStore({ reserveBytes: 900 });
      let consumed = false;
      async function* source() {
        consumed = true;
        yield Buffer.from('hello world');
      }

      await expect(store.put(Readable.from(source()), { sizeHint: 500 })).rejects.toThrow(
        InsufficientStorageError,
      );
      expect(consumed).toBe(false);
    });
  });

  describe('concurrency', () => {
    it('admits identical content from concurrent puts exactly once', async () => {
      const store = makeStore();
      const results = await Promise.all(
        Array.from({ length: 4 }, () => store.put(Readable.from(Buffer.from('hello world')))),
      );

      const hashes = new Set(results.map(r => r.hash));
      expect(hashes.size).toBe(1);
      expect(fakeBlob.rows.size).toBe(1);
      expect(await store.has(HELLO_HASH)).toBe(true);
    });

    it('keeps distinct content distinct', async () => {
      const store = makeStore();
      const contents = Array.from({ length: 4 }, () => randomUUID());
      const results = await Promise.all(
        contents.map(content => store.put(Readable.from(Buffer.from(content)))),
      );

      expect(new Set(results.map(r => r.hash)).size).toBe(4);
      for (const [i, { hash }] of results.entries()) {
        expect((await readAll(await store.get(hash))).toString()).toBe(contents[i]);
      }
    });
  });
});
