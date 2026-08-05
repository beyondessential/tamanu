import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BlobHashMismatchError,
  InsufficientStorageError,
  InvalidParameterError,
  NotFoundError,
} from '@tamanu/errors';

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
  });

  describe('free-disk floor', () => {
    it('refuses new content rather than cross into the reserve', async () => {
      volumeFreeBytes = 100;
      const store = makeStore({ reserveBytes: 1000 });

      await expect(store.put(Readable.from(Buffer.from('hello world')))).rejects.toThrow(
        InsufficientStorageError,
      );
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

  describe('get with range', () => {
    it('streams only the requested byte range, inclusive of both ends', async () => {
      const store = makeStore();
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));

      expect((await readAll(await store.get(hash, { start: 6 }))).toString()).toBe('world');
      expect((await readAll(await store.get(hash, { start: 0, end: 4 }))).toString()).toBe('hello');
      expect((await readAll(await store.get(hash, { start: 4, end: 6 }))).toString()).toBe('o w');
    });
  });

  describe('stat', () => {
    it('reports size and integrity state for a held blob', async () => {
      const store = makeStore();
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));

      expect(await store.stat(hash)).toEqual({ size: 11, integrityState: 'verified' });
    });

    it('reports null for an absent blob', async () => {
      const store = makeStore();
      expect(await store.stat(HELLO_HASH)).toBeNull();
    });

    it('reports null for a registry row whose bytes are missing', async () => {
      const store = makeStore();
      const { hash } = await store.put(Readable.from(Buffer.from('hello world')));
      await fs.rm(path.join(root, 'sha256'), { recursive: true, force: true });

      expect(await store.stat(hash)).toBeNull();
    });
  });

  // spec: XFER
  describe('staging', () => {
    it('accumulates appended content and commits it as a stored blob', async () => {
      const store = makeStore();
      expect(await store.stagedSize(HELLO_HASH)).toBe(0);

      const first = await store.stage(HELLO_HASH, Readable.from(Buffer.from('hello ')), {
        offset: 0,
      });
      expect(first.stagedSize).toBe(6);

      const second = await store.stage(HELLO_HASH, Readable.from(Buffer.from('world')), {
        offset: 6,
      });
      expect(second.stagedSize).toBe(11);

      const result = await store.commitStaged(HELLO_HASH);
      expect(result).toEqual({ hash: HELLO_HASH, size: 11, existed: false });
      expect(await store.has(HELLO_HASH)).toBe(true);
      expect((await readAll(await store.get(HELLO_HASH))).toString()).toBe('hello world');
      expect(await store.stagedSize(HELLO_HASH)).toBe(0);
    });

    it('resumes across store instances, as after a restart', async () => {
      await makeStore().stage(HELLO_HASH, Readable.from(Buffer.from('hello ')), { offset: 0 });

      const restarted = makeStore();
      expect(await restarted.stagedSize(HELLO_HASH)).toBe(6);
      await restarted.stage(HELLO_HASH, Readable.from(Buffer.from('world')), { offset: 6 });
      expect(await restarted.commitStaged(HELLO_HASH)).toMatchObject({ existed: false });
      expect(await restarted.has(HELLO_HASH)).toBe(true);
    });

    it('rejects an append whose offset does not match the staged bytes', async () => {
      const store = makeStore();
      await store.stage(HELLO_HASH, Readable.from(Buffer.from('hello ')), { offset: 0 });

      await expect(
        store.stage(HELLO_HASH, Readable.from(Buffer.from('world')), { offset: 3 }),
      ).rejects.toThrow(InvalidParameterError);
      expect(await store.stagedSize(HELLO_HASH)).toBe(6);
    });

    it('keeps bytes already appended when the source fails partway', async () => {
      const store = makeStore();
      async function* failingSource() {
        yield Buffer.from('he');
        throw new Error('connection lost');
      }

      await expect(
        store.stage(HELLO_HASH, Readable.from(failingSource()), { offset: 0 }),
      ).rejects.toThrow('connection lost');
      expect(await store.stagedSize(HELLO_HASH)).toBe(2);

      await store.stage(HELLO_HASH, Readable.from(Buffer.from('llo world')), { offset: 2 });
      expect(await store.commitStaged(HELLO_HASH)).toMatchObject({
        hash: HELLO_HASH,
        existed: false,
      });
    });

    it('verifies the complete staged content and discards a mismatch', async () => {
      const store = makeStore();
      await store.stage(HELLO_HASH, Readable.from(Buffer.from('goodbye moon')), { offset: 0 });

      await expect(store.commitStaged(HELLO_HASH)).rejects.toThrow(BlobHashMismatchError);
      expect(await store.has(HELLO_HASH)).toBe(false);
      expect(await store.stagedSize(HELLO_HASH)).toBe(0);
    });

    it('commits an already-held hash as a no-op and drops the staging', async () => {
      const store = makeStore();
      await store.put(Readable.from(Buffer.from('hello world')));
      await store.stage(HELLO_HASH, Readable.from(Buffer.from('anything')), { offset: 0 });

      const result = await store.commitStaged(HELLO_HASH);
      expect(result).toEqual({ hash: HELLO_HASH, size: 11, existed: true });
      expect(await store.stagedSize(HELLO_HASH)).toBe(0);
    });

    it('throws NotFoundError when committing with nothing staged', async () => {
      const store = makeStore();
      await expect(store.commitStaged(HELLO_HASH)).rejects.toThrow(NotFoundError);
    });

    it('commits a zero-byte staging as the empty blob', async () => {
      const store = makeStore();
      await store.stage(EMPTY_HASH, Readable.from(Buffer.alloc(0)), { offset: 0 });

      const result = await store.commitStaged(EMPTY_HASH);
      expect(result).toEqual({ hash: EMPTY_HASH, size: 0, existed: false });
      expect(await store.has(EMPTY_HASH)).toBe(true);
    });

    it('serialises concurrent appends for one hash so they cannot interleave', async () => {
      const store = makeStore();
      async function* slowSource(text: string) {
        for (const character of text) {
          await new Promise(resolve => setTimeout(resolve, 1));
          yield Buffer.from(character);
        }
      }

      const [first, second] = await Promise.allSettled([
        store.stage(HELLO_HASH, Readable.from(slowSource('hello ')), { offset: 0 }),
        store.stage(HELLO_HASH, Readable.from(slowSource('world')), { offset: 0 }),
      ]);

      // the first append wins in full; the second fails its offset check
      // cleanly instead of interleaving, and can resume from the new size
      expect(first.status).toBe('fulfilled');
      expect(second.status).toBe('rejected');
      expect((second as PromiseRejectedResult).reason).toBeInstanceOf(InvalidParameterError);
      expect(await store.stagedSize(HELLO_HASH)).toBe(6);

      await store.stage(HELLO_HASH, Readable.from(Buffer.from('world')), { offset: 6 });
      expect(await store.commitStaged(HELLO_HASH)).toMatchObject({ hash: HELLO_HASH });
    });

    it('discards staged content on request', async () => {
      const store = makeStore();
      await store.stage(HELLO_HASH, Readable.from(Buffer.from('hello ')), { offset: 0 });

      await store.discardStaged(HELLO_HASH);
      expect(await store.stagedSize(HELLO_HASH)).toBe(0);
    });

    it('refuses to stage rather than cross into the free-disk reserve', async () => {
      volumeFreeBytes = 100;
      const store = makeStore({ reserveBytes: 1000 });

      await expect(
        store.stage(HELLO_HASH, Readable.from(Buffer.from('hello ')), { offset: 0 }),
      ).rejects.toThrow(InsufficientStorageError);
    });

    it('rejects a malformed hash', async () => {
      const store = makeStore();
      await expect(
        store.stage('not-a-hash', Readable.from(Buffer.from('x')), { offset: 0 }),
      ).rejects.toThrow(/algorithm-tagged/);
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
