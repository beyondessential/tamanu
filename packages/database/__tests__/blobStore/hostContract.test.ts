import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import { BLOB_HOST_CONTRACT, type BlobHostUnderTest } from '@tamanu/blobs';

import { BlobStore } from '../../src/blobStore/BlobStore';
import { closeDatabase, createTestDatabase } from '../utilities';

// The server's side of the shared host contract, run against the real registry
// so the upsert and recency semantics are exercised as SQL rather than as a
// description of it. Mobile runs the same cases against its own host.
describe('blob host contract (server)', () => {
  let models: any;
  let sequelize: any;
  let store: BlobStore;
  let root: string;
  let scratchDir: string;

  beforeAll(async () => {
    ({ models, sequelize } = await createTestDatabase());
  });

  afterAll(async () => {
    if (root) {
      await fs.rm(root, { recursive: true, force: true });
    }
    await closeDatabase();
  });

  afterEach(async () => {
    if (root) {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-contract-'));
    scratchDir = path.join(root, 'scratch');
    await fs.mkdir(scratchDir, { recursive: true });
    store = new BlobStore({
      root,
      models,
      getFreeDiskReserveBytes: async () => 0,
    });
    await models.Blob.destroy({ where: {}, force: true });
  });

  const host = (): BlobHostUnderTest => ({
    async writeScratchFile(content) {
      const filePath = path.join(scratchDir, `file-${Math.random().toString(36).slice(2)}`);
      await fs.writeFile(filePath, content);
      return filePath;
    },
    async hashFile(filePath, algorithm) {
      const { createHash } = await import('node:crypto');
      const hasher = createHash(algorithm);
      hasher.update(await fs.readFile(filePath));
      return hasher.digest('hex');
    },
    async fileExists(filePath) {
      return await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
    },
    pathFor(hash) {
      const [algorithm, digest] = hash.split(':');
      return path.join(root, algorithm!, digest!.slice(0, 2), digest!.slice(2, 4), digest!);
    },
    async place(fromPath, toPath) {
      await fs.mkdir(path.dirname(toPath), { recursive: true });
      await fs.rename(fromPath, toPath);
    },
    async register(content, tier) {
      // Admission through the store itself, so the contract drives the same
      // upsert production does. The store hashes the content it is given, so the
      // stored identity is the content's real hash rather than a fixed one.
      await store.put(Readable.from([Buffer.from(content)]), { tier });
    },
    async row(hash) {
      const found = await models.Blob.findOne({ where: { hash }, paranoid: false });
      return found
        ? {
            tier: found.tier,
            lastAccessedAt: found.lastAccessedAt,
            deletedAt: found.deletedAt ?? null,
          }
        : null;
    },
    async softDelete(hash) {
      await models.Blob.destroy({ where: { hash } });
    },
    async delete(hash) {
      await store.delete(hash);
    },
    async touch(hash, options) {
      await store.touch(hash, options);
    },
    async setLastAccessedAt(hash, when) {
      await sequelize.query('UPDATE blobs SET last_accessed_at = $when WHERE hash = $hash', {
        bind: { hash, when: when.toISOString() },
      });
    },
    async stagedSize(hash) {
      return await store.stagedSize(hash);
    },
    async stageAppendPart(hash, content) {
      const offset = await store.stagedSize(hash);
      const { stagedSize } = await store.stage(hash, Readable.from([Buffer.from(content)]), {
        offset,
      });
      return stagedSize;
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
