import { BLOB_TIERS } from '@tamanu/constants';

import { Database } from '~/infra/db';
import { LAST_SUCCESSFUL_PUSH } from '~/services/sync/constants';
import { FakeBlobFileSystem, sha256Hash } from '/root/tests/helpers/fakeBlobFileSystem';
import { MobileBlobStore } from './MobileBlobStore';
import { reconcileAttachments } from './reconcileAttachments';
import { deriveFreeDiskReserveBytes } from './deviceStorage';

describe('reconcileAttachments', () => {
  let fs: FakeBlobFileSystem;
  let store: MobileBlobStore;

  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.Blob.getRepository().clear();
    await Database.models.Attachment.getRepository().clear();
    await Database.models.LocalSystemFact.getRepository().clear();
    await setPushTick(10);
    fs = new FakeBlobFileSystem();
    store = new MobileBlobStore({
      root: '/blobs',
      models: Database.models,
      getFreeDiskReserveBytes: deriveFreeDiskReserveBytes,
      fs,
    });
  });

  // verifies spec: MOB — a not-yet-pushed legacy row is adopted into the outbox
  it('adopts an un-pushed legacy attachment into the outbox and hands it its hash', async () => {
    fs.seed('/docs/legacy-new.jpg', 'legacy content A');
    await seedLegacyAttachment('legacy-new', '/docs/legacy-new.jpg', 20); // tick > 10

    await reconcileAttachments({ models: Database.models, blobStore: store, fs });

    const row = await Database.models.Attachment.findOne({ where: { id: 'att-legacy-new' } });
    const hash = sha256Hash('legacy content A');
    expect(row.hash).toBe(hash);
    expect(row.filePath).toBeNull();
    const blob = await Database.models.Blob.findOne({ where: { hash } });
    expect(blob.tier).toBe(BLOB_TIERS.OUTBOX);
  });

  // verifies spec: MOB, ATCH — an already-pushed legacy row is adopted as cache
  // with the hash set without disturbing the sync tick (central keeps its legacy row)
  it('adopts an already-pushed legacy attachment as cache without re-syncing it', async () => {
    fs.seed('/docs/legacy-old.jpg', 'legacy content B');
    await seedLegacyAttachment('legacy-old', '/docs/legacy-old.jpg', 5); // tick <= 10

    await reconcileAttachments({ models: Database.models, blobStore: store, fs });

    const row = await Database.models.Attachment.findOne({ where: { id: 'att-legacy-old' } });
    const hash = sha256Hash('legacy content B');
    expect(row.hash).toBe(hash);
    expect(row.filePath).toBeNull();
    // sync tick untouched: the record is not re-queued for push
    expect(Number(row.updatedAtSyncTick)).toBe(5);
    const blob = await Database.models.Blob.findOne({ where: { hash } });
    expect(blob.tier).toBe(BLOB_TIERS.CACHE);
  });

  // verifies spec: MOB — a legacy row whose file is gone loses its pointer
  it('clears the pointer for a legacy attachment whose file is missing', async () => {
    await seedLegacyAttachment('legacy-gone', '/docs/missing.jpg', 20);

    await reconcileAttachments({ models: Database.models, blobStore: store, fs });

    const row = await Database.models.Attachment.findOne({ where: { id: 'att-legacy-gone' } });
    expect(row.hash).toBeNull();
    expect(row.filePath).toBeNull();
  });

  // verifies spec: MOB, CACHE — a stranded outbox blob is demoted to reclaimable cache
  it('demotes an outbox blob with no referencing record to cache', async () => {
    const strandedHash = sha256Hash('stranded');
    fs.seed(store.pathFor(strandedHash), 'stranded');
    await Database.models.Blob.getRepository().query(
      `INSERT INTO blobs (id, hash, size, integrityState, tier, lastAccessedAt)
       VALUES (?, ?, 100, 'verified', ?, datetime('now'))`,
      ['blob-stranded', strandedHash, BLOB_TIERS.OUTBOX],
    );

    await reconcileAttachments({ models: Database.models, blobStore: store, fs });

    const blob = await Database.models.Blob.findOne({ where: { hash: strandedHash } });
    expect(blob.tier).toBe(BLOB_TIERS.CACHE);
  });

  // A referenced outbox blob stays in the outbox — it is not stranded.
  it('leaves a referenced outbox blob in the outbox', async () => {
    const hash = sha256Hash('referenced');
    fs.seed(store.pathFor(hash), 'referenced');
    await Database.models.Blob.getRepository().query(
      `INSERT INTO blobs (id, hash, size, integrityState, tier, lastAccessedAt)
       VALUES (?, ?, 100, 'verified', ?, datetime('now'))`,
      ['blob-referenced', hash, BLOB_TIERS.OUTBOX],
    );
    await Database.models.Attachment.getRepository().query(
      `INSERT INTO attachments (id, type, hash, size, updatedAtSyncTick)
       VALUES (?, 'image/jpeg', ?, 100, 20)`,
      ['att-referenced', hash],
    );

    await reconcileAttachments({ models: Database.models, blobStore: store, fs });

    const blob = await Database.models.Blob.findOne({ where: { hash } });
    expect(blob.tier).toBe(BLOB_TIERS.OUTBOX);
  });

  async function setPushTick(tick: number) {
    await Database.models.LocalSystemFact.getRepository().query(
      `INSERT INTO local_system_facts (id, key, value) VALUES (?, ?, ?)`,
      [`fact-${LAST_SUCCESSFUL_PUSH}`, LAST_SUCCESSFUL_PUSH, String(tick)],
    );
  }

  async function seedLegacyAttachment(label: string, filePath: string, syncTick: number) {
    await Database.models.Attachment.getRepository().query(
      `INSERT INTO attachments (id, type, filePath, size, updatedAtSyncTick)
       VALUES (?, 'image/jpeg', ?, 100, ?)`,
      [`att-${label}`, filePath, syncTick],
    );
  }
});
