import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { CENTRAL_PARITY_TIERS, parityGeometry } from '@tamanu/blobs';
import { BLOB_INTEGRITY_STATES, BLOB_TIERS } from '@tamanu/constants';
import { BLOB_FAULTS, BlobStore } from '@tamanu/database/blobStore';

import { CentralBlobHealer } from '../app/blobIntegrity';
import { createTestContext } from './utilities';

// 16+2 shards of 4 KiB at the default proportion, so two damaged shards are the
// budget and three are past it.
const COVERED_BYTES = 64 * 1024;
const geometry = parityGeometry(COVERED_BYTES, 0.1);

const coveredContent = seed => {
  const blob = Buffer.alloc(COVERED_BYTES);
  let state = seed;
  for (let offset = 0; offset < blob.length; offset++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    blob[offset] = (state >>> 16) & 0xff;
  }
  return blob;
};

// spec: FEC
// Central's healer with parity available. Every copy central holds is
// authoritative, so error correction is the rung that keeps a recoverable blob
// from becoming an escalation nobody can resolve without a backup.
describe('central blob error correction', () => {
  let ctx;
  let models;
  let root;
  let blobStore;
  let blobHealer;
  let errorCorrection;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Blob.destroy({ where: {}, force: true });
    await models.BlobQuarantine.destroy({ where: {}, force: true });
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'central-parity-test-'));
    errorCorrection = { enabled: true, proportion: 0.1 };
    blobStore = new BlobStore({
      root,
      models,
      getFreeDiskReserveBytes: async () => 0,
      errorCorrection: {
        coveredTiers: CENTRAL_PARITY_TIERS,
        getSettings: async () => errorCorrection,
      },
    });
    blobHealer = new CentralBlobHealer({ blobStore, models });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const pathOf = hash => {
    const digest = hash.split(':')[1];
    return path.join(root, 'sha256', digest.slice(0, 2), digest.slice(2, 4), digest.slice(4));
  };

  // Bit rot over whole shards: the bytes change, the path and the row do not.
  const damageShards = async (hash, shards) => {
    const handle = await fs.open(pathOf(hash), 'r+');
    try {
      for (const shard of shards) {
        await handle.write(
          Buffer.alloc(geometry.shardSize, `x${shard}`),
          0,
          geometry.shardSize,
          shard * geometry.shardSize,
        );
      }
    } finally {
      await handle.close();
    }
  };

  const admit = async (content, tier = BLOB_TIERS.CACHE) =>
    await blobStore.put(Readable.from(content), { tier });

  const healCorrupt = async hash =>
    await blobHealer.heal({
      hash,
      fault: BLOB_FAULTS.CORRUPT,
      blob: await models.Blob.findOne({ where: { hash } }),
    });

  it('covers a blob whatever tier its row carries', async () => {
    // Central's registry is authoritative for everything it holds, so unlike a
    // facility the tier does not narrow coverage.
    const { hash, size } = await admit(coveredContent(1));
    expect(await blobStore.coversWithParity({ size, tier: BLOB_TIERS.CACHE })).toBe(true);
    expect((await models.Blob.findOne({ where: { hash } })).hasParity).toBe(true);
  });

  it('repairs a corrupt blob rather than recording it corrupt', async () => {
    const content = coveredContent(2);
    const { hash } = await admit(content);
    await damageShards(hash, [3, 12]);

    await healCorrupt(hash);

    const row = await models.Blob.findOne({ where: { hash } });
    expect(row.integrityState).toBe(BLOB_INTEGRITY_STATES.VERIFIED);
    expect(row.correctionCount).toBe(1);
    expect(row.lastCorrectedAt).toBeTruthy();
    expect(await fs.readFile(pathOf(hash))).toEqual(content);
  });

  it('records a blob damaged beyond the parity budget corrupt', async () => {
    const { hash } = await admit(coveredContent(3));
    await damageShards(hash, [3, 7, 12]);

    await healCorrupt(hash);

    const row = await models.Blob.findOne({ where: { hash } });
    expect(row.integrityState).toBe(BLOB_INTEGRITY_STATES.CORRUPT);
    expect(row.correctionCount).toBe(0);
  });

  // verifies spec: AV, FEC — a repair ends in the same bytes being held again,
  // which for content the deployment has recorded as malware is the one outcome
  // to avoid. The damage here is inside the parity budget, so the only reason
  // not to reconstruct it is the quarantine.
  it('refuses to reconstruct quarantined content its parity could restore', async () => {
    const content = coveredContent(5);
    const { hash } = await admit(content);
    await models.BlobQuarantine.create({ hash });
    await damageShards(hash, [4]);

    await healCorrupt(hash);

    const row = await models.Blob.findOne({ where: { hash } });
    expect(row.integrityState).toBe(BLOB_INTEGRITY_STATES.CORRUPT);
    expect(row.correctionCount).toBe(0);
    expect(await fs.readFile(pathOf(hash))).not.toEqual(content);
  });

  it('records it corrupt as before where the blob carries no parity', async () => {
    errorCorrection = { enabled: false, proportion: 0.1 };
    const { hash } = await admit(coveredContent(4));
    await damageShards(hash, [5]);

    await healCorrupt(hash);

    expect((await models.Blob.findOne({ where: { hash } })).integrityState).toBe(
      BLOB_INTEGRITY_STATES.CORRUPT,
    );
  });
});
