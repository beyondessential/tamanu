import { BLOB_TIERS } from '@tamanu/constants';
import { ERROR_TYPE } from '@tamanu/errors';

import { Database } from '~/infra/db';
import { LAST_SUCCESSFUL_PUSH } from '~/services/sync/constants';
import { sha256Hash } from '/root/tests/helpers/fakeBlobFileSystem';
import { BlobOutboxPusher } from './BlobOutboxPusher';

describe('BlobOutboxPusher', () => {
  let transferChannel: { pushToCentral: jest.Mock };
  let blobCache: { demote: jest.Mock };
  let pusher: BlobOutboxPusher;

  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.Blob.getRepository().clear();
    await Database.models.Attachment.getRepository().clear();
    await Database.models.LocalSystemFact.getRepository().clear();
    await setPushTick(10);
    transferChannel = { pushToCentral: jest.fn(async () => ({ acknowledged: true })) };
    blobCache = { demote: jest.fn() };
    pusher = new BlobOutboxPusher({
      models: Database.models,
      transferChannel: transferChannel as any,
      blobCache: blobCache as any,
    });
  });

  // verifies spec: CACHE — only blobs whose record has synced are eligible
  it('treats an outbox blob as eligible once its record is at or behind the push cursor', async () => {
    const synced = await seedOutboxAttachment('synced', 5); // tick <= 10
    const notYet = await seedOutboxAttachment('not-yet', 20); // tick > 10

    const eligible = await pusher.eligibleOutboxHashes();
    expect(eligible).toContain(synced);
    expect(eligible).not.toContain(notYet);
  });

  // verifies spec: CACHE, XFER — push then demote on acknowledgement
  it('pushes eligible blobs and demotes them once acknowledged', async () => {
    const hash = await seedOutboxAttachment('acked', 5);

    const counts = await pusher.runOnce();
    expect(counts.pushed).toBe(1);
    expect(transferChannel.pushToCentral).toHaveBeenCalledWith(hash);
    expect(blobCache.demote).toHaveBeenCalledWith(hash);
  });

  // verifies spec: CACHE — a blob whose record has not synced is left in the outbox
  it('counts a blob whose record is ahead of the push cursor as ineligible', async () => {
    await seedOutboxAttachment('not-yet', 20);

    const counts = await pusher.runOnce();
    expect(counts).toMatchObject({ pushed: 0, ineligible: 1 });
    expect(transferChannel.pushToCentral).not.toHaveBeenCalled();
  });

  // verifies spec: BLAC — a forbidden offer does not block the queue
  it('continues past a refused push without demoting it', async () => {
    const forbidden = await seedOutboxAttachment('forbidden', 5);
    const ok = await seedOutboxAttachment('ok', 5);
    transferChannel.pushToCentral.mockImplementation(async (hash: string) => {
      if (hash === forbidden) {
        throw Object.assign(new Error('forbidden'), { type: ERROR_TYPE.FORBIDDEN });
      }
      return { acknowledged: true };
    });

    const counts = await pusher.runOnce();
    expect(counts.pushed).toBe(1);
    expect(counts.failed).toBe(1);
    expect(blobCache.demote).toHaveBeenCalledWith(ok);
    expect(blobCache.demote).not.toHaveBeenCalledWith(forbidden);
  });

  // verifies spec: CAP — a blob unpushed across successful syncs escalates
  it('flags outbox dysfunction once a blob stays eligible past the tick gap', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await seedOutboxAttachment('stuck', 1);
    // eligible marker gets stamped at the current push cursor (10)…
    await pusher.recordSyncCycle();
    // …and by a much later cursor it has gone unpushed across many cycles
    await setPushTick(100);
    await pusher.recordSyncCycle();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/outbox dysfunction/i));
    errorSpy.mockRestore();
  });

  async function setPushTick(tick: number) {
    await Database.models.LocalSystemFact.getRepository().query(
      `INSERT INTO local_system_facts (id, key, value)
       VALUES (?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET value = excluded.value`,
      [`fact-${LAST_SUCCESSFUL_PUSH}`, LAST_SUCCESSFUL_PUSH, String(tick)],
    );
  }

  // An outbox blob with a referencing attachment record at the given sync tick.
  async function seedOutboxAttachment(label: string, syncTick: number) {
    const hash = sha256Hash(label);
    await Database.models.Blob.getRepository().query(
      `INSERT INTO blobs (id, hash, size, integrityState, tier, lastAccessedAt)
       VALUES (?, ?, ?, 'verified', ?, datetime('now'))`,
      [`blob-${label}`, hash, 100, BLOB_TIERS.OUTBOX],
    );
    await Database.models.Attachment.getRepository().query(
      `INSERT INTO attachments (id, type, hash, size, updatedAtSyncTick)
       VALUES (?, 'image/jpeg', ?, 100, ?)`,
      [`att-${label}`, hash, syncTick],
    );
    return hash;
  }
});
