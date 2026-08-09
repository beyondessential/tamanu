import RNFS from 'react-native-fs';
import { IsNull, Not } from 'typeorm';

import { BLOB_TIERS } from '@tamanu/constants';

import { MODELS_MAP } from '~/models/modelsMap';
import { getSyncTick } from '~/services/sync/utils';
import { LAST_SUCCESSFUL_PUSH } from '~/services/sync/constants';
import { MobileBlobStore, BlobFileSystem } from './MobileBlobStore';

export interface ReconcileAttachmentsOptions {
  models: typeof MODELS_MAP;
  blobStore: MobileBlobStore;
  fs?: BlobFileSystem;
}

// spec: MOB
// Startup reconciliation of the attachment world: adopt pre-blob-store rows
// into the store, and demote outbox blobs stranded without a referencing
// record. Idempotent and resumable — a pass interrupted partway leaves rows
// that the next start picks up, and a device with nothing to reconcile pays
// two cheap queries.
export async function reconcileAttachments({
  models,
  blobStore,
  fs = RNFS as unknown as BlobFileSystem,
}: ReconcileAttachmentsOptions): Promise<void> {
  await adoptLegacyAttachments({ models, blobStore, fs });
  await demoteStrandedOutboxBlobs(models);
}

// Legacy rows hold their content as a file in the documents directory, pointed
// at by filePath. Adoption admits the file into the store and hands the record
// its hash. The tier and the sync handling split on whether the record has
// reached the central server:
//
// - A row not yet pushed is adopted into the outbox and saved normally, so it
//   re-syncs carrying its hash and central receives a hash-backed record ahead
//   of the byte push, as for any new capture.
// - A row already pushed exists on central as a legacy in-database attachment,
//   whose reader prefers a hash when one is set. Central already durably holds
//   the bytes in-row, so the local copy is adopted as evictable cache, and the
//   hash is set by raw update so the sync tick is untouched and central's
//   legacy row is left alone.
// - A row whose file is gone has lost its content; the pointer is cleared and
//   the record presents as awaiting content.
async function adoptLegacyAttachments({
  models,
  blobStore,
  fs,
}: Required<ReconcileAttachmentsOptions>): Promise<void> {
  const repository = models.Attachment.getRepository();
  const legacyRows = await repository.find({
    where: { filePath: Not(IsNull()) },
    withDeleted: true,
  });
  if (legacyRows.length === 0) {
    return;
  }

  const lastPush = await getSyncTick(models, LAST_SUCCESSFUL_PUSH);
  for (const row of legacyRows) {
    try {
      const filePath = row.filePath;

      if (row.deletedAt || !(await fs.exists(filePath))) {
        // A removed attachment's file is dead weight; a live row without its
        // file has lost its content and presents as awaiting it.
        if (await fs.exists(filePath)) {
          await fs.unlink(filePath);
        }
        await repository.query(
          `UPDATE attachments SET filePath = NULL, updatedAt = datetime('now') WHERE id = ?`,
          [row.id],
        );
        continue;
      }

      const isPendingPush = Number(row.updatedAtSyncTick) > lastPush;
      const { hash, size } = await blobStore.putFile(filePath, {
        tier: isPendingPush ? BLOB_TIERS.OUTBOX : BLOB_TIERS.CACHE,
      });

      if (isPendingPush) {
        row.hash = hash;
        row.size = size;
        row.filePath = null;
        await row.save();
      } else {
        await repository.query(
          `UPDATE attachments SET hash = ?, size = ?, updatedAt = datetime('now'), filePath = NULL WHERE id = ?`,
          [hash, size, row.id],
        );
      }
    } catch (error) {
      // Likely insufficient storage or an unreadable file; leave the row for
      // the next start rather than failing the rest of the pass.
      console.warn(
        `reconcileAttachments: could not adopt legacy attachment ${row.id}: ${error.message}`,
      );
    }
  }
}

// spec: MOB, CACHE
// An outbox blob no live attachment record references is stranded — a crash
// between admission and record creation, or a removed draft photo. It can
// never become eligible for push, so demote it to cache where the LRU budget
// reclaims it.
async function demoteStrandedOutboxBlobs(models: typeof MODELS_MAP): Promise<void> {
  await models.Blob.getRepository().query(
    `
      UPDATE blobs
      SET tier = ?, eligibleSinceTick = NULL
      WHERE tier = ?
        AND deletedAt IS NULL
        AND hash NOT IN (
          SELECT hash FROM attachments WHERE hash IS NOT NULL AND deletedAt IS NULL
        )
    `,
    [BLOB_TIERS.CACHE, BLOB_TIERS.OUTBOX],
  );
}
