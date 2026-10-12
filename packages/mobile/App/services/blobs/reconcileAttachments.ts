import RNFS from 'react-native-fs';
import { IsNull, MoreThan, Not } from 'typeorm';

import { BLOB_TIERS } from '@tamanu/constants';

import { MODELS_MAP } from '~/models/modelsMap';
import { getSyncTick } from '~/services/sync/utils';
import { LAST_SUCCESSFUL_PUSH } from '~/services/sync/constants';
import { MobileBlobStore, BlobFileSystem } from './MobileBlobStore';

const LEGACY_ADOPTION_BATCH_SIZE = 50;

export interface ReconcileAttachmentsOptions {
  models: typeof MODELS_MAP;
  blobStore: MobileBlobStore;
  fs?: BlobFileSystem;
}

// spec: MOB
// Idempotent and resumable; a device with nothing to reconcile pays two cheap queries.
export async function reconcileAttachments({
  models,
  blobStore,
  fs = RNFS as unknown as BlobFileSystem,
}: ReconcileAttachmentsOptions): Promise<void> {
  await adoptLegacyAttachments({ models, blobStore, fs });
  await demoteStrandedOutboxBlobs(models);
}

// An unpushed row goes to the outbox and re-syncs carrying its hash. A pushed row already exists on
// central with its bytes in-row, so it's adopted as cache and the hash set by raw update, leaving
// the sync tick alone. A row whose file is gone is cleared to awaiting content.
async function adoptLegacyAttachments({
  models,
  blobStore,
  fs,
}: Required<ReconcileAttachmentsOptions>): Promise<void> {
  const repository = models.Attachment.getRepository();
  const lastPush = await getSyncTick(models, LAST_SUCCESSFUL_PUSH);

  // A cursor rather than a plain limit: a failed row keeps filePath set, so the same batch would be
  // re-read forever.
  let cursor = '';
  for (;;) {
    const legacyRows = await repository.find({
      where: { filePath: Not(IsNull()), id: MoreThan(cursor) },
      withDeleted: true,
      order: { id: 'ASC' },
      take: LEGACY_ADOPTION_BATCH_SIZE,
    });
    if (legacyRows.length === 0) {
      return;
    }
    cursor = legacyRows[legacyRows.length - 1].id;

    for (const row of legacyRows) {
      try {
        const filePath = row.filePath;

        if (row.deletedAt || !(await fs.exists(filePath))) {
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
        // Leave the row for the next start rather than failing the pass.
        console.warn(
          `reconcileAttachments: could not adopt legacy attachment ${row.id}: ${error.message}`,
        );
      }
    }
  }
}

// spec: MOB, CACHE
// A stranded outbox blob can never become eligible for push, so demote it for the LRU budget to
// reclaim.
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
