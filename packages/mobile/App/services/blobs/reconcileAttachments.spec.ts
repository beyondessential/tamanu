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

  // verifies spec: MOB
  it('adopts an un-pushed legacy attachment into the outbox and hands it its hash', async () => {
    fs.seed('/docs/legacy-new.jpg', 'legacy content A');
    await seedLegacyAttachment('legacy-new', '/docs/legacy-new.jpg', 20);

    await reconcileAttachments({ models: Database.models, blobStore: store, fs });

    const row = await Database.models.Attachment.findOne({ where: { id: 'att-legacy-new' } });
    const hash = sha256Hash('legacy content A');
    expect(row.hash).toBe(hash);
    expect(row.filePath).toBeNull();
    const blob = await Database.models.Blob.findOne({ where: { hash } });
    expect(blob.tier).toBe(BLOB_TIERS.OUTBOX);
  });

  // verifies spec: MOB, ATCH
  it('adopts an already-pushed legacy attachment as cache without re-syncing it', async () => {
    fs.seed('/docs/legacy-old.jpg', 'legacy content B');
    await seedLegacyAttachment('legacy-old', '/docs/legacy-old.jpg', 5);

    await reconcileAttachments({ models: Database.models, blobStore: store, fs });

    const row = await Database.models.Attachment.findOne({ where: { id: 'att-legacy-old' } });
    const hash = sha256Hash('legacy content B');
    expect(row.hash).toBe(hash);
    expect(row.filePath).toBeNull();
    expect(Number(row.updatedAtSyncTick)).toBe(5);
    const blob = await Database.models.Blob.findOne({ where: { hash } });
    expect(blob.tier).toBe(BLOB_TIERS.CACHE);
  });

  // verifies spec: MOB
  it('clears the pointer for a legacy attachment whose file is missing', async () => {
    await seedLegacyAttachment('legacy-gone', '/docs/missing.jpg', 20);

    await reconcileAttachments({ models: Database.models, blobStore: store, fs });

    const row = await Database.models.Attachment.findOne({ where: { id: 'att-legacy-gone' } });
    expect(row.hash).toBeNull();
    expect(row.filePath).toBeNull();
  });

  // The cursor advances past a failed row, so it can't loop the pass forever.
  it('finishes the pass when a legacy attachment cannot be adopted', async () => {
    fs.seed('/docs/unreadable.jpg', 'unreadable');
    await seedLegacyAttachment('legacy-broken', '/docs/unreadable.jpg', 20);
    fs.seed('/docs/fine.jpg', 'adoptable content');
    await seedLegacyAttachment('legacy-fine', '/docs/fine.jpg', 20);
    jest.spyOn(store, 'putFile').mockImplementation(async sourcePath => {
      if (sourcePath === '/docs/unreadable.jpg') throw new Error('cannot read file');
      return { hash: sha256Hash('adoptable content'), size: 17, existed: false };
    });

    await reconcileAttachments({ models: Database.models, blobStore: store, fs });

    const broken = await Database.models.Attachment.findOne({
      where: { id: 'att-legacy-broken' },
    });
    expect(broken.filePath).toBe('/docs/unreadable.jpg');
    const fine = await Database.models.Attachment.findOne({ where: { id: 'att-legacy-fine' } });
    expect(fine.filePath).toBeNull();
    expect(fine.hash).toBe(sha256Hash('adoptable content'));
  });

  // verifies spec: MOB, CACHE
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
