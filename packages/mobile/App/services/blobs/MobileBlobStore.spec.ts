import { BLOB_INTEGRITY_STATES, BLOB_TIERS } from '@tamanu/constants';

import { Database } from '~/infra/db';
import { FakeBlobFileSystem, sha256Hash } from '/root/tests/helpers/fakeBlobFileSystem';
import { MobileBlobStore } from './MobileBlobStore';
import { deriveFreeDiskReserveBytes } from './deviceStorage';

const ROOT = '/blobs';

const buildStore = (fs: FakeBlobFileSystem, overrides = {}) =>
  new MobileBlobStore({
    root: ROOT,
    models: Database.models,
    getFreeDiskReserveBytes: deriveFreeDiskReserveBytes,
    fs,
    ...overrides,
  });

describe('MobileBlobStore', () => {
  let fs: FakeBlobFileSystem;
  let store: MobileBlobStore;

  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.Blob.getRepository().clear();
    fs = new FakeBlobFileSystem();
    store = buildStore(fs);
  });

  describe('putFile', () => {
    // verifies spec: CAS, MOB
    it('admits a file by hash, moving it into the store and consuming the source', async () => {
      fs.seed('/tmp/capture.jpg', 'hello world');
      const result = await store.putFile('/tmp/capture.jpg', { tier: BLOB_TIERS.OUTBOX });

      expect(result).toMatchObject({ hash: sha256Hash('hello world'), size: 11, existed: false });
      // one copy, in the store, none left at the source
      expect(await fs.exists('/tmp/capture.jpg')).toBe(false);
      expect(await fs.exists(store.pathFor(result.hash))).toBe(true);

      const row = await Database.models.Blob.findOne({ where: { hash: result.hash } });
      expect(row).toMatchObject({ tier: BLOB_TIERS.OUTBOX, size: 11 });
    });

    // verifies spec: CAS, MOB — identical content resolves to a single stored blob
    it('deduplicates identical content and keeps the existing tier', async () => {
      fs.seed('/tmp/a.jpg', 'same bytes');
      const first = await store.putFile('/tmp/a.jpg', { tier: BLOB_TIERS.CACHE });

      fs.seed('/tmp/b.jpg', 'same bytes');
      const second = await store.putFile('/tmp/b.jpg', { tier: BLOB_TIERS.OUTBOX });

      expect(second.hash).toBe(first.hash);
      expect(second.existed).toBe(true);
      expect(await fs.exists('/tmp/b.jpg')).toBe(false);
      const rows = await Database.models.Blob.getRepository().find({ where: { hash: first.hash } });
      expect(rows).toHaveLength(1);
      // content already held as cache stays cache
      expect(rows[0].tier).toBe(BLOB_TIERS.CACHE);
    });

    // verifies spec: CAP — refuse rather than cross the reserve, error names device storage
    it('refuses admission when the device is below its free-disk reserve', async () => {
      fs.totalSpace = 20 * 1024 ** 3;
      fs.freeSpace = 100 * 1024 ** 2; // below the ~1 GB reserve
      fs.seed('/tmp/big.jpg', 'content');

      await expect(store.putFile('/tmp/big.jpg')).rejects.toThrow(/device storage/i);
    });

    // verifies spec: CAP — evict cache before refusing for the floor
    it('evicts cache before refusing, and admits once space is freed', async () => {
      fs.totalSpace = 20 * 1024 ** 3;
      fs.freeSpace = 100 * 1024 ** 2;
      const evictCache = jest.fn(async () => {
        fs.freeSpace = 5 * 1024 ** 3;
      });
      store = buildStore(fs, { evictCache });
      fs.seed('/tmp/x.jpg', 'content');

      const result = await store.putFile('/tmp/x.jpg');
      expect(evictCache).toHaveBeenCalled();
      expect(result.existed).toBe(false);
    });
  });

  describe('stat / has / servablePath', () => {
    it('reports a held blob and refuses a quarantined one from serving', async () => {
      fs.seed('/tmp/c.jpg', 'served');
      const { hash } = await store.putFile('/tmp/c.jpg');

      expect(await store.has(hash)).toBe(true);
      expect(await store.servablePath(hash)).toBe(store.pathFor(hash));

      await store.quarantine(hash);
      // still present, never served
      expect(await store.has(hash)).toBe(true);
      await expect(store.servablePath(hash)).rejects.toThrow(/quarantined/i);
    });

    it('treats bytes without a registry row as not held', async () => {
      const orphanHash = sha256Hash('orphan');
      fs.seed(store.pathFor(orphanHash), 'orphan');
      expect(await store.has(orphanHash)).toBe(false);
    });
  });

  describe('staging and commit', () => {
    // verifies spec: XFER — verification covers the complete staged content
    it('commits staged content that matches its hash', async () => {
      const hash = sha256Hash('transferred');
      fs.seed('/tmp/part', 'transferred');
      await store.appendStagedFromFile(hash, '/tmp/part');

      const result = await store.commitStaged(hash);
      expect(result).toMatchObject({ hash, size: 11, existed: false });
      expect(await store.has(hash)).toBe(true);
    });

    it('resumes staging across parts and commits the whole', async () => {
      const hash = sha256Hash('abcdef');
      fs.seed('/tmp/p1', 'abc');
      expect(await store.appendStagedFromFile(hash, '/tmp/p1')).toBe(3);
      fs.seed('/tmp/p2', 'def');
      expect(await store.appendStagedFromFile(hash, '/tmp/p2')).toBe(6);

      const result = await store.commitStaged(hash);
      expect(result.hash).toBe(hash);
      expect(await store.has(hash)).toBe(true);
    });

    // verifies spec: XFER, SCRUB — mismatch discards the staging, does not admit
    it('rejects staged content that does not hash to the requested hash', async () => {
      const claimedHash = sha256Hash('the real content');
      fs.seed('/tmp/wrong', 'tampered content');
      await store.appendStagedFromFile(claimedHash, '/tmp/wrong');

      await expect(store.commitStaged(claimedHash)).rejects.toThrow(/hashed to/i);
      expect(await store.has(claimedHash)).toBe(false);
      expect(await store.stagedSize(claimedHash)).toBe(0);
    });

    it('commits as a no-op when the content is already held', async () => {
      fs.seed('/tmp/held.jpg', 'already');
      const { hash } = await store.putFile('/tmp/held.jpg');

      fs.seed('/tmp/staged', 'already');
      await store.appendStagedFromFile(hash, '/tmp/staged');
      const result = await store.commitStaged(hash);
      expect(result.existed).toBe(true);
      expect(await store.stagedSize(hash)).toBe(0);
    });
  });

  describe('verify', () => {
    // verifies spec: SCRUB — detect corruption on read
    it('detects when stored bytes no longer match the hash', async () => {
      fs.seed('/tmp/ok.jpg', 'good');
      const { hash } = await store.putFile('/tmp/ok.jpg');
      expect(await store.verify(hash)).toBe(true);

      fs.seed(store.pathFor(hash), 'corrupted');
      expect(await store.verify(hash)).toBe(false);
    });
  });

  describe('delete', () => {
    it('removes both the registry row and the bytes', async () => {
      fs.seed('/tmp/d.jpg', 'delete me');
      const { hash } = await store.putFile('/tmp/d.jpg');
      await store.delete(hash);

      expect(await store.has(hash)).toBe(false);
      expect(await fs.exists(store.pathFor(hash))).toBe(false);
      expect(await Database.models.Blob.findOne({ where: { hash } })).toBeNull();
    });
  });

  it('resurrects a soft-deleted registry row on re-admission with the fresh tier', async () => {
    fs.seed('/tmp/r.jpg', 'resurrect');
    const { hash } = await store.putFile('/tmp/r.jpg', { tier: BLOB_TIERS.CACHE });
    // soft-delete the row but leave the bytes as an adoptable orphan
    await Database.models.Blob.getRepository().softDelete({ hash });

    fs.seed('/tmp/r2.jpg', 'resurrect');
    const result = await store.putFile('/tmp/r2.jpg', { tier: BLOB_TIERS.OUTBOX });
    expect(result.hash).toBe(hash);

    const row = await Database.models.Blob.findOne({ where: { hash } });
    expect(row).toMatchObject({ tier: BLOB_TIERS.OUTBOX, integrityState: BLOB_INTEGRITY_STATES.VERIFIED });
    expect(row.deletedAt).toBeNull();
  });
});
