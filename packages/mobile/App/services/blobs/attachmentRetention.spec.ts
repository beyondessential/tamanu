import { BLOB_TIERS } from '@tamanu/constants';

import { Database } from '~/infra/db';
import { LAST_SUCCESSFUL_PUSH } from '~/services/sync/constants';
import { FakeBlobFileSystem } from '/root/tests/helpers/fakeBlobFileSystem';
import { BlobOutboxPusher } from './BlobOutboxPusher';
import { MobileBlobCache } from './MobileBlobCache';
import { MobileBlobStore } from './MobileBlobStore';
import { deriveFreeDiskReserveBytes } from './deviceStorage';

const PUSH_TICK = 10;
const ATTACHMENT_ID = 'att-photo';
const PHOTO_BYTES = 'photo bytes';

describe('attachment records after their bytes reach central', () => {
  let fs: FakeBlobFileSystem;
  let store: MobileBlobStore;
  let cache: MobileBlobCache;
  let fetched: string[];
  let pusher: BlobOutboxPusher;

  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.Blob.getRepository().clear();
    await Database.models.Attachment.getRepository().clear();
    await Database.models.LocalSystemFact.getRepository().clear();
    await Database.models.LocalSystemFact.getRepository().query(
      `INSERT INTO local_system_facts (id, key, value) VALUES (?, ?, ?)`,
      [`fact-${LAST_SUCCESSFUL_PUSH}`, LAST_SUCCESSFUL_PUSH, String(PUSH_TICK)],
    );
    fs = new FakeBlobFileSystem();
    store = new MobileBlobStore({
      root: '/blobs',
      models: Database.models,
      getFreeDiskReserveBytes: deriveFreeDiskReserveBytes,
      fs,
    });
    cache = new MobileBlobCache({ blobStore: store, models: Database.models, fs });
    fetched = [];
    cache.setTransferChannel({
      fetchFromCentral: async (hash: string) => {
        fetched.push(hash);
        fs.seed('/tmp/from-central.jpg', PHOTO_BYTES);
        await store.putFile('/tmp/from-central.jpg', { tier: BLOB_TIERS.CACHE });
      },
    } as any);
    pusher = new BlobOutboxPusher({
      models: Database.models,
      transferChannel: {
        pushToCentral: async () => ({ acknowledged: true }),
      } as any,
      blobCache: cache,
    });
  });

  // verifies spec: MOB — the push that makes the bytes evictable leaves the
  // record alone
  it('retains the record once the push is acknowledged', async () => {
    const hash = await captureAndPush();

    expect(await tierOf(hash)).toBe(BLOB_TIERS.CACHE);
    const retained = await Database.models.Attachment.findOne({ where: { id: ATTACHMENT_ID } });
    expect(retained).not.toBeNull();
    expect(retained.hash).toBe(hash);
  });

  // verifies spec: MOB — reclaiming the space takes the bytes and not the
  // record, so the hash it carries fetches the content back
  it('refetches the content by the retained hash once the blob is reclaimed', async () => {
    const hash = await captureAndPush();
    const { size } = await store.stat(hash);

    await cache.evictBytes(size);
    expect(await store.has(hash)).toBe(false);

    const retained = await Database.models.Attachment.findOne({ where: { id: ATTACHMENT_ID } });
    expect(retained).not.toBeNull();
    expect(await cache.readBase64(retained.hash)).toBe(Buffer.from(PHOTO_BYTES).toString('base64'));
    expect(fetched).toEqual([hash]);
  });

  // A captured photo, its synchronised record, and the pass that delivers the
  // bytes to central.
  async function captureAndPush(): Promise<string> {
    fs.seed('/tmp/photo.jpg', PHOTO_BYTES);
    const { hash, size } = await cache.putOutbox('/tmp/photo.jpg');
    await Database.models.Attachment.getRepository().query(
      `INSERT INTO attachments (id, type, hash, size, updatedAtSyncTick)
       VALUES (?, 'image/jpeg', ?, ?, ?)`,
      [ATTACHMENT_ID, hash, size, PUSH_TICK - 5],
    );
    await pusher.runOnce();
    return hash;
  }

  async function tierOf(hash: string): Promise<string> {
    const row = await Database.models.Blob.findOne({ where: { hash } });
    return row.tier;
  }
});
