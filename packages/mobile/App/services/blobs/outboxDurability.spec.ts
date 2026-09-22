import { BLOB_TIERS } from '@tamanu/constants';

import { Database } from '~/infra/db';
import { LAST_SUCCESSFUL_PUSH } from '~/services/sync/constants';
import { FakeBlobFileSystem } from '/root/tests/helpers/fakeBlobFileSystem';
import { BlobOutboxPusher } from './BlobOutboxPusher';
import { MobileBlobCache } from './MobileBlobCache';
import { MobileBlobStore } from './MobileBlobStore';
import { reconcileAttachments } from './reconcileAttachments';
import { deriveFreeDiskReserveBytes } from './deviceStorage';

const PUSH_TICK = 10;

describe('capture stranded before its record, then captured again', () => {
  let fs: FakeBlobFileSystem;
  let store: MobileBlobStore;
  let cache: MobileBlobCache;
  let pushed: string[];
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
    pushed = [];
    pusher = new BlobOutboxPusher({
      models: Database.models,
      transferChannel: {
        pushToCentral: async (hash: string) => {
          pushed.push(hash);
          return { acknowledged: true };
        },
      } as any,
      blobCache: cache,
    });
  });

  // verifies spec: MOB, CACHE — content demoted after its record was never
  // created rejoins the outbox on the capture that does reference it, so the
  // pusher still delivers bytes central has never been offered
  it('pushes the content once a later capture gives it a record', async () => {
    fs.seed('/tmp/photo.jpg', 'photo bytes');
    const { hash } = await cache.putOutbox('/tmp/photo.jpg');

    await reconcileAttachments({ models: Database.models, blobStore: store, fs });
    expect(await tierOf(hash)).toBe(BLOB_TIERS.CACHE);

    fs.seed('/tmp/photo-again.jpg', 'photo bytes');
    await cache.putOutbox('/tmp/photo-again.jpg');
    await seedSyncedAttachment(hash);

    await pusher.runOnce();

    expect(pushed).toEqual([hash]);
    // acknowledged, so it is cache the central server holds rather than lost
    expect(await tierOf(hash)).toBe(BLOB_TIERS.CACHE);
  });

  async function tierOf(hash: string): Promise<string> {
    const row = await Database.models.Blob.findOne({ where: { hash } });
    return row.tier;
  }

  async function seedSyncedAttachment(hash: string): Promise<void> {
    await Database.models.Attachment.getRepository().query(
      `INSERT INTO attachments (id, type, hash, size, updatedAtSyncTick)
       VALUES (?, 'image/jpeg', ?, 100, ?)`,
      ['att-recaptured', hash, PUSH_TICK - 5],
    );
  }
});
