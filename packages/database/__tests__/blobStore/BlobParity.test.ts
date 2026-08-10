import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  CENTRAL_PARITY_TIERS,
  FACILITY_PARITY_TIERS,
  MINIMUM_COVERED_BLOB_SIZE,
  PARITY_SIDECAR_SUFFIX,
  SHARD_DIGEST_BYTES,
  parityGeometry,
  parityShardOffset,
  paritySidecarByteCount,
  shardDigestOffset,
} from '@tamanu/blobs';
import { BLOB_INTEGRITY_STATES, BLOB_TIERS, type BlobTier } from '@tamanu/constants';
import { InsufficientStorageError } from '@tamanu/errors';

import { BlobStore } from '../../src/blobStore/BlobStore';
import type { Blob } from '../../src/models/Blob';

// 16+2 shards of 4 KiB at the default proportion, so two damaged shards are
// exactly the budget and three are past it.
const BLOB_BYTES = 64 * 1024;
const DEFAULT_PERCENT = 0.1;

interface FakeRow {
  id: string;
  hash: string;
  size: number;
  integrityState: string;
  tier: string;
  lastScrubbedAt: Date | null;
  hasParity: boolean;
  correctionCount: number;
  lastCorrectedAt: Date | null;
}

// In-memory Blob registry covering what the store asks of it, including the two
// raw statements: the admission upsert and the correction stamp.
function makeFakeBlobModel() {
  const rows = new Map<string, FakeRow>();
  return {
    rows,
    async findOne({ where: { hash } }: { where: { hash: string } }) {
      return rows.get(hash) ?? null;
    },
    async update(values: Partial<FakeRow>, { where }: { where: { hash: string | string[] } }) {
      const hashes = Array.isArray(where.hash) ? where.hash : [where.hash];
      let affected = 0;
      for (const hash of hashes) {
        const row = rows.get(hash);
        if (row) {
          Object.assign(row, values);
          affected += 1;
        }
      }
      return [affected];
    },
    async destroy({ where: { hash } }: { where: { hash: string } }) {
      rows.delete(hash);
    },
    sequelize: {
      async query(sql: string, { bind }: { bind: Record<string, string | number> }) {
        const hash = bind.hash as string;
        if (sql.includes('UPDATE blobs')) {
          const row = rows.get(hash);
          if (row) {
            row.integrityState = bind.integrityState as string;
            row.correctionCount += 1;
            row.lastCorrectedAt = new Date();
          }
          return;
        }
        if (!rows.has(hash)) {
          rows.set(hash, {
            id: (bind.id as string) ?? randomUUID(),
            hash,
            size: bind.size as number,
            integrityState: bind.integrityState as string,
            tier: (bind.tier as string) ?? BLOB_TIERS.CACHE,
            lastScrubbedAt: new Date(),
            hasParity: false,
            correctionCount: 0,
            lastCorrectedAt: null,
          });
        }
      },
    },
  };
}

// Deterministic content, so a seeded-corruption case fails the same way each run.
function content(bytes = BLOB_BYTES, seed = 1): Buffer {
  const blob = Buffer.alloc(bytes);
  let state = seed;
  for (let offset = 0; offset < bytes; offset++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    blob[offset] = (state >>> 16) & 0xff;
  }
  return blob;
}

describe('blob parity', () => {
  let root: string;
  let fakeBlob: ReturnType<typeof makeFakeBlobModel>;
  let volumeFreeBytes: number;
  let loggedErrors: string[];
  const geometry = parityGeometry(BLOB_BYTES, DEFAULT_PERCENT);

  const makeStore = ({
    enabled = true,
    parityPercent = 10,
    coveredTiers = CENTRAL_PARITY_TIERS,
    reserveBytes = 0,
  }: {
    enabled?: boolean;
    parityPercent?: number;
    coveredTiers?: readonly BlobTier[];
    reserveBytes?: number;
  } = {}) =>
    new BlobStore({
      root,
      models: { Blob: fakeBlob as unknown as typeof Blob },
      getFreeDiskReserveBytes: async () => reserveBytes,
      errorCorrection: {
        coveredTiers,
        getSettings: async () => ({ enabled, proportion: parityPercent / 100 }),
      },
      log: {
        error: message => loggedErrors.push(message),
        warn: () => {},
      },
      statfs: async () => ({ bavail: volumeFreeBytes, bsize: 1 }),
    });

  const storedPath = (hash: string) => {
    const digest = hash.split(':')[1];
    return path.join(root, 'sha256', digest.slice(0, 2), digest.slice(2, 4), digest.slice(4));
  };
  const sidecarPath = (hash: string) => `${storedPath(hash)}${PARITY_SIDECAR_SUFFIX}`;

  // Bit rot over one shard's worth of a stored blob: its bytes change, its path
  // and its registry row do not.
  const damageShards = async (hash: string, shards: number[]) => {
    const handle = await fs.open(storedPath(hash), 'r+');
    try {
      for (const shard of shards) {
        await handle.write(
          content(geometry.shardSize, 500 + shard),
          0,
          geometry.shardSize,
          shard * geometry.shardSize,
        );
      }
    } finally {
      await handle.close();
    }
  };

  const admit = async (blob: Buffer, tier: BlobTier = BLOB_TIERS.CACHE, store = makeStore()) =>
    await store.put(Readable.from(blob), { tier });

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-parity-test-'));
    fakeBlob = makeFakeBlobModel();
    volumeFreeBytes = 10_000_000;
    loggedErrors = [];
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  describe('coverage at admission', () => {
    // spec: FEC
    it('writes a sidecar beside a covered blob and records that it has one', async () => {
      const { hash } = await admit(content());

      const sidecar = await fs.stat(sidecarPath(hash));
      expect(sidecar.size).toBe(paritySidecarByteCount(geometry));
      expect(fakeBlob.rows.get(hash)!.hasParity).toBe(true);
    });

    // spec: FEC
    it('skips a blob below the size floor', async () => {
      const { hash } = await admit(content(MINIMUM_COVERED_BLOB_SIZE - 1));

      await expect(fs.access(sidecarPath(hash))).rejects.toThrow();
      expect(fakeBlob.rows.get(hash)!.hasParity).toBe(false);
    });

    // spec: FEC
    it('writes nothing while error correction is off', async () => {
      const { hash } = await admit(content(), BLOB_TIERS.CACHE, makeStore({ enabled: false }));

      await expect(fs.access(sidecarPath(hash))).rejects.toThrow();
      expect(fakeBlob.rows.get(hash)!.hasParity).toBe(false);
    });

    // spec: FEC
    it('covers a facility outbox blob but not a cache one', async () => {
      const facility = makeStore({ coveredTiers: FACILITY_PARITY_TIERS });
      const outbox = await admit(content(BLOB_BYTES, 2), BLOB_TIERS.OUTBOX, facility);
      const cached = await admit(content(BLOB_BYTES, 3), BLOB_TIERS.CACHE, facility);

      await expect(fs.access(sidecarPath(outbox.hash))).resolves.toBeUndefined();
      await expect(fs.access(sidecarPath(cached.hash))).rejects.toThrow();
    });

    // spec: FEC
    it('is skipped by the store walk, so the scrub reads it as parity', async () => {
      const { hash } = await admit(content());

      const walked = [];
      for await (const stored of makeStore().storedHashes()) {
        walked.push(stored);
      }
      expect(walked).toEqual([hash]);
    });

    // spec: FEC
    it('scales the sidecar with the parity proportion', async () => {
      const store = makeStore({ parityPercent: 50 });
      const { hash } = await admit(content(), BLOB_TIERS.CACHE, store);

      const sidecar = await fs.stat(sidecarPath(hash));
      expect(sidecar.size).toBe(
        paritySidecarByteCount(parityGeometry(BLOB_BYTES, 0.5)),
      );
    });
  });

  describe('capacity', () => {
    // spec: CAP
    it('refuses an admission that the blob plus its parity would not fit', async () => {
      const blob = content();
      const sidecarBytes = paritySidecarByteCount(geometry);
      // Room for the blob but not for the blob and its sidecar together.
      const reserveBytes = 100_000;
      volumeFreeBytes = reserveBytes + BLOB_BYTES + sidecarBytes - 1;

      await expect(
        makeStore({ reserveBytes }).put(Readable.from(blob), { sizeHint: BLOB_BYTES }),
      ).rejects.toThrow(InsufficientStorageError);

      // The same volume admits it once nothing is reserved for parity, so it is
      // the sidecar that made the difference rather than the blob alone.
      const withoutParity = makeStore({ enabled: false, reserveBytes });
      await expect(
        withoutParity.put(Readable.from(content()), { sizeHint: BLOB_BYTES }),
      ).resolves.toMatchObject({ size: BLOB_BYTES });
    });

    // spec: FEC
    it('stores the blob unprotected rather than failing when parity cannot be written', async () => {
      const blob = content();
      // Room to admit the blob, but not enough left above the reserve for the
      // sidecar. With no size hint the admission cannot know that up front, so
      // this is a failed parity write rather than a refused admission.
      const reserveBytes = 100_000;
      volumeFreeBytes = reserveBytes + paritySidecarByteCount(geometry) - 1;
      const store = makeStore({ reserveBytes });

      const { hash } = await store.put(Readable.from(blob));

      expect(fakeBlob.rows.get(hash)!.hasParity).toBe(false);
      expect(await fs.readFile(storedPath(hash))).toEqual(blob);
    });
  });

  describe('repair', () => {
    // spec: FEC
    it('repairs a single damaged shard and records the correction', async () => {
      const blob = content();
      const store = makeStore();
      const { hash } = await admit(blob, BLOB_TIERS.CACHE, store);
      await damageShards(hash, [7]);
      expect(await fs.readFile(storedPath(hash))).not.toEqual(blob);

      expect(await store.repairFromParity(hash)).toBe(true);

      expect(await fs.readFile(storedPath(hash))).toEqual(blob);
      const row = fakeBlob.rows.get(hash)!;
      expect(row.correctionCount).toBe(1);
      expect(row.lastCorrectedAt).toBeInstanceOf(Date);
      expect(row.integrityState).toBe(BLOB_INTEGRITY_STATES.VERIFIED);
    });

    // spec: FEC
    it('repairs damage exactly at the parity budget', async () => {
      const blob = content();
      const store = makeStore();
      const { hash } = await admit(blob, BLOB_TIERS.CACHE, store);
      await damageShards(hash, [2, 11]);

      expect(await store.repairFromParity(hash)).toBe(true);
      expect(await fs.readFile(storedPath(hash))).toEqual(blob);
    });

    // spec: FEC
    it('leaves the blob alone when damage is beyond the parity budget', async () => {
      const blob = content();
      const store = makeStore();
      const { hash } = await admit(blob, BLOB_TIERS.CACHE, store);
      await damageShards(hash, [2, 5, 11]);
      const damaged = await fs.readFile(storedPath(hash));

      expect(await store.repairFromParity(hash)).toBe(false);

      expect(await fs.readFile(storedPath(hash))).toEqual(damaged);
      expect(fakeBlob.rows.get(hash)!.correctionCount).toBe(0);
    });

    // spec: FEC
    it('reports no repair for a blob that carries no parity', async () => {
      const store = makeStore({ enabled: false });
      const { hash } = await admit(content(), BLOB_TIERS.CACHE, store);

      expect(await makeStore().repairFromParity(hash)).toBe(false);
    });

    // spec: FEC
    // The unconditional hash check earning its place: with a damaged parity shard
    // whose digest has been forged to match, the decode reports success and emits
    // bytes that are not the blob.
    it('discards a reconstruction that does not match the blob hash', async () => {
      const blob = content();
      const store = makeStore();
      const { hash } = await admit(blob, BLOB_TIERS.CACHE, store);

      const sidecar = await fs.open(sidecarPath(hash), 'r+');
      try {
        const rotted = content(geometry.shardSize, 77);
        await sidecar.write(rotted, 0, rotted.length, parityShardOffset(geometry, 0, 0));
        // Forge the digest so the damaged parity shard passes as intact and the
        // decode trusts it.
        await sidecar.write(
          createHash('sha256').update(rotted).digest().subarray(0, SHARD_DIGEST_BYTES),
          0,
          SHARD_DIGEST_BYTES,
          shardDigestOffset(geometry, 0, geometry.dataShards),
        );
      } finally {
        await sidecar.close();
      }
      await damageShards(hash, [4]);
      const damaged = await fs.readFile(storedPath(hash));

      expect(await store.repairFromParity(hash)).toBe(false);

      // Rejected by the hash check specifically: the decode itself reported
      // success, so nothing else here would have caught it.
      expect(loggedErrors).toContain(
        'BlobStore: reconstruction from parity did not match the blob hash',
      );
      expect(await fs.readFile(storedPath(hash))).toEqual(damaged);
      expect(fakeBlob.rows.get(hash)!.correctionCount).toBe(0);
    });

    // spec: FEC
    it('leaves no temporary files behind, repaired or not', async () => {
      const store = makeStore();
      const { hash } = await admit(content(), BLOB_TIERS.CACHE, store);

      await damageShards(hash, [3]);
      expect(await store.repairFromParity(hash)).toBe(true);
      await damageShards(hash, [1, 6, 9]);
      expect(await store.repairFromParity(hash)).toBe(false);

      expect(await fs.readdir(path.join(root, 'tmp'))).toHaveLength(0);
    });
  });

  describe('parity is derived', () => {
    // spec: FEC
    it('regenerates a sidecar for a covered blob that has none', async () => {
      const blob = content();
      const store = makeStore({ enabled: false });
      const { hash, size } = await admit(blob, BLOB_TIERS.CACHE, store);
      await expect(fs.access(sidecarPath(hash))).rejects.toThrow();

      // The retrofit the scrub performs once error correction is switched on.
      const enabled = makeStore();
      expect(await enabled.writeParity({ hash, size, tier: BLOB_TIERS.CACHE })).toBe(true);

      expect(fakeBlob.rows.get(hash)!.hasParity).toBe(true);
      await damageShards(hash, [5]);
      expect(await enabled.repairFromParity(hash)).toBe(true);
      expect(await fs.readFile(storedPath(hash))).toEqual(blob);
    });

    // spec: FEC
    it('reproduces the same parity when regenerated over intact content', async () => {
      const store = makeStore();
      const { hash, size } = await admit(content(), BLOB_TIERS.CACHE, store);
      const first = await fs.readFile(sidecarPath(hash));

      await store.writeParity({ hash, size, tier: BLOB_TIERS.CACHE });

      expect(await fs.readFile(sidecarPath(hash))).toEqual(first);
    });

    // spec: FEC
    it('refuses to protect a blob this server does not cover', async () => {
      const facility = makeStore({ coveredTiers: FACILITY_PARITY_TIERS });
      const { hash, size } = await admit(content(), BLOB_TIERS.CACHE, facility);

      expect(await facility.writeParity({ hash, size, tier: BLOB_TIERS.CACHE })).toBe(false);
      await expect(fs.access(sidecarPath(hash))).rejects.toThrow();
    });

    // spec: FEC
    it('dies with its blob on delete', async () => {
      const store = makeStore();
      const { hash } = await admit(content(), BLOB_TIERS.CACHE, store);
      await expect(fs.access(sidecarPath(hash))).resolves.toBeUndefined();

      await store.delete(hash);

      await expect(fs.access(sidecarPath(hash))).rejects.toThrow();
    });

    // spec: FEC
    it('is discarded on demotion out of the outbox', async () => {
      const facility = makeStore({ coveredTiers: FACILITY_PARITY_TIERS });
      const { hash } = await admit(content(), BLOB_TIERS.OUTBOX, facility);
      await expect(fs.access(sidecarPath(hash))).resolves.toBeUndefined();

      await facility.discardParity(hash);

      await expect(fs.access(sidecarPath(hash))).rejects.toThrow();
      expect(fakeBlob.rows.get(hash)!.hasParity).toBe(false);
    });
  });
});
