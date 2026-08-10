import { BLOB_HOST_CONTRACT, BlobHostUnderTest } from '@tamanu/blobs';
import { blobPathSegments } from '@tamanu/utils';

import { Database } from '~/infra/db';
import { FakeBlobFileSystem } from '/root/tests/helpers/fakeBlobFileSystem';
import { MobileBlobStore } from './MobileBlobStore';
import { deriveFreeDiskReserveBytes } from './deviceStorage';

const ROOT = '/blobs';

// SQLite stores datetime('now') as a timezone-less UTC string, which Date would
// otherwise read as local time.
const asInstant = (value: string | null | undefined): Date | null =>
  value ? new Date(`${value.replace(' ', 'T')}Z`) : null;

// The device's side of the shared host contract. The server runs the same cases
// against Postgres, so a registry or hashing divergence fails on whichever host
// diverged rather than surfacing later as content one side cannot resolve.
describe('blob host contract (mobile)', () => {
  let fs: FakeBlobFileSystem;
  let store: MobileBlobStore;
  let scratchCount = 0;

  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.Blob.getRepository().clear();
    fs = new FakeBlobFileSystem();
    store = new MobileBlobStore({
      root: ROOT,
      models: Database.models,
      getFreeDiskReserveBytes: deriveFreeDiskReserveBytes,
      fs,
    });
  });

  const host = (): BlobHostUnderTest => ({
    async writeScratchFile(content) {
      const path = `/tmp/contract-${(scratchCount += 1)}`;
      fs.seed(path, content);
      return path;
    },
    async hashFile(path, algorithm) {
      return await fs.hash(path, algorithm);
    },
    async fileExists(path) {
      return await fs.exists(path);
    },
    pathFor(hash) {
      return [ROOT, ...blobPathSegments(hash)].join('/');
    },
    async place(fromPath, toPath) {
      await fs.mkdir(toPath.slice(0, toPath.lastIndexOf('/')));
      await fs.moveFile(fromPath, toPath);
    },
    async register(hash, size, tier) {
      const path = `/tmp/register-${(scratchCount += 1)}`;
      fs.seed(path, 'hello world');
      const result = await store.putFile(path, { tier });
      expect(result.hash).toBe(hash);
      expect(result.size).toBe(size);
    },
    async row(hash) {
      const [found] = await Database.models.Blob.getRepository().query(
        'SELECT tier, lastAccessedAt, deletedAt FROM blobs WHERE hash = ?',
        [hash],
      );
      return found
        ? {
            tier: found.tier,
            lastAccessedAt: asInstant(found.lastAccessedAt)!,
            deletedAt: asInstant(found.deletedAt),
          }
        : null;
    },
    async softDelete(hash) {
      await Database.models.Blob.getRepository().query(
        "UPDATE blobs SET deletedAt = datetime('now') WHERE hash = ?",
        [hash],
      );
    },
    async delete(hash) {
      await store.delete(hash);
    },
    async touch(hash, options) {
      await store.touch(hash, options);
    },
    async setLastAccessedAt(hash, when) {
      await Database.models.Blob.getRepository().query(
        'UPDATE blobs SET lastAccessedAt = ? WHERE hash = ?',
        [when.toISOString().replace('T', ' ').slice(0, 19), hash],
      );
    },
    async stagedSize(hash) {
      return await store.stagedSize(hash);
    },
    async stageAppendPart(hash, content) {
      const partPath = await store.prepareStagingPart(hash);
      fs.seed(partPath, content);
      return await store.appendStagedFromFile(hash, partPath);
    },
    async discardStaged(hash) {
      await store.discardStaged(hash);
    },
  });

  for (const contractCase of BLOB_HOST_CONTRACT) {
    it(contractCase.name, async () => {
      await contractCase.run(host());
    });
  }
});
