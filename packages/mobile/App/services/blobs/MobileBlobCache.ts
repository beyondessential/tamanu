import RNFS from 'react-native-fs';

import { BlobEviction } from '@tamanu/blobs';
import { BLOB_TIERS } from '@tamanu/constants';
import { BlobHashMismatchError, NotFoundError } from '@tamanu/errors';

import { Blob } from '~/models/Blob';
import { MobileBlobStore, BlobFileSystem, PutResult } from './MobileBlobStore';
import { deriveCacheBudgetBytes } from './deviceStorage';
import type { BlobTransferChannel } from './BlobTransferChannel';

// spec: CACHE
const RECENCY_COALESCE_SECONDS = 60;

// spec: SCRUB
// Long enough that browsing a patient's photos hashes each file once. Outbox content is verified on
// every read.
const VERIFICATION_COALESCE_SECONDS = 60 * 60;

// A cache bigger than this is trimmed across successive passes.
const EVICTION_SCAN_LIMIT = 1000;

export interface MobileBlobCacheOptions {
  blobStore: MobileBlobStore;
  models: { Blob: typeof Blob };
  fs?: BlobFileSystem;
}

// spec: CACHE, MOB
export class MobileBlobCache {
  #blobStore: MobileBlobStore;
  #models: { Blob: typeof Blob };
  #fs: BlobFileSystem;
  #eviction: BlobEviction;

  #transferChannel: BlobTransferChannel | null = null;

  constructor({ blobStore, models, fs }: MobileBlobCacheOptions) {
    this.#blobStore = blobStore;
    this.#models = models;
    this.#fs = fs ?? (RNFS as unknown as BlobFileSystem);
    this.#eviction = new BlobEviction({
      budgetBytes: async cacheSizeBytes =>
        deriveCacheBudgetBytes(await this.#fs.getFSInfo(), cacheSizeBytes),
      cacheSizeBytes: () => this.cacheSizeBytes(),
      cacheRowsLruFirst: limit => this.#cacheRowsLruFirst(limit),
      mostRecentlyUsedHash: () => this.#mostRecentlyUsedCacheHash(),
      delete: hash => this.#blobStore.delete(hash),
      onWarning: (message, details) =>
        console.warn(`MobileBlobCache: ${message} (${JSON.stringify(details)})`),
    }, { scanLimit: EVICTION_SCAN_LIMIT });
  }

  setTransferChannel(transferChannel: BlobTransferChannel): void {
    this.#transferChannel = transferChannel;
  }

  // spec: CACHE, MOB
  /**
   * Call within the operation that creates the referencing record; startup reconciliation demotes a
   * blob stranded by a crash between them.
   */
  async putOutbox(sourcePath: string): Promise<PutResult> {
    const admitted = await this.#blobStore.putFile(sourcePath, { tier: BLOB_TIERS.OUTBOX });
    if (admitted.existed) {
      await this.#models.Blob.getRepository().update(
        { hash: admitted.hash },
        { tier: BLOB_TIERS.OUTBOX },
      );
    }
    return admitted;
  }

  // spec: MOB, SCRUB
  /**
   * The device runs no scheduled scrub, so every read verifies. Corrupt cache content is refetched;
   * corrupt outbox content is the only copy, so it's kept and surfaced.
   */
  async open(hash: string): Promise<string> {
    // spec: AV
    // Before the fetch, so known-bad content is never pulled onto the device.
    if (await this.#blobStore.isQuarantined(hash)) {
      throw new NotFoundError(`Blob is quarantined: ${hash}`);
    }
    let held = await this.#blobStore.stat(hash);
    if (!held) {
      await this.#fetchIntoCache(hash);
      held = await this.#blobStore.stat(hash);
    }

    if (!(await this.#verifiedForRead(hash, held?.tier))) {
      if (held?.tier === BLOB_TIERS.OUTBOX) {
        await this.#blobStore.markCorrupt(hash);
        throw new BlobHashMismatchError(
          `Captured content for ${hash} is corrupt on this device; retained`,
        );
      }
      await this.#blobStore.delete(hash);
      await this.#fetchIntoCache(hash);
      if (!(await this.#blobStore.verify(hash))) {
        throw new BlobHashMismatchError(`Refetched content for ${hash} failed verification`);
      }
      held = await this.#blobStore.stat(hash);
    }

    await this.#touch(hash);
    return await this.#blobStore.servablePath(hash, held);
  }

  async readBase64(hash: string): Promise<string> {
    const path = await this.open(hash);
    return await this.#fs.readFile(path, 'base64');
  }

  // spec: SCRUB
  /**
   * Cache content is refetchable, so it's verified at most once per window to spare a constrained
   * device.
   */
  async #verifiedForRead(hash: string, tier?: string): Promise<boolean> {
    if (tier !== BLOB_TIERS.OUTBOX) {
      if (await this.#blobStore.verifiedWithin(hash, VERIFICATION_COALESCE_SECONDS)) {
        return true;
      }
    }
    return await this.#blobStore.verify(hash);
  }

  async #fetchIntoCache(hash: string): Promise<void> {
    if (!this.#transferChannel) {
      throw new NotFoundError(
        `Blob not held locally and no central connection to fetch it: ${hash}`,
      );
    }
    await this.#transferChannel.fetchFromCentral(hash);
    // Enforcement never evicts the most recently used blob, which the new arrival is.
    try {
      await this.enforceBudget();
    } catch (error) {
      console.warn(
        `MobileBlobCache.open: budget enforcement after fetch failed: ${error.message}`,
      );
    }
  }

  // spec: CACHE
  async demote(hash: string): Promise<void> {
    await this.#models.Blob.getRepository().update(
      { hash, tier: BLOB_TIERS.OUTBOX },
      { tier: BLOB_TIERS.CACHE, eligibleSinceTick: null },
    );
  }

  async cacheSizeBytes(): Promise<number> {
    const [row] = await this.#models.Blob.getRepository().query(
      `SELECT COALESCE(SUM(size), 0) AS total FROM blobs WHERE tier = ? AND deletedAt IS NULL`,
      [BLOB_TIERS.CACHE],
    );
    return Number(row?.total ?? 0);
  }

  // spec: CACHE
  /**
   * The budget is re-derived from device storage each time, so a filling device gives cache space
   * back.
   */
  async enforceBudget(): Promise<{ evictedBytes: number; evictedCount: number }> {
    return await this.#eviction.enforceBudget();
  }

  // spec: CAP
  async evictBytes(bytesNeeded: number): Promise<{ evictedBytes: number; evictedCount: number }> {
    return await this.#eviction.evictBytes(bytesNeeded);
  }

  async #cacheRowsLruFirst(limit: number): Promise<{ hash: string; size: number }[]> {
    const rows = await this.#models.Blob.getRepository().find({
      where: { tier: BLOB_TIERS.CACHE },
      order: { lastAccessedAt: 'ASC', createdAt: 'ASC' },
      take: limit,
    });
    return rows.map(({ hash, size }) => ({ hash, size: Number(size) }));
  }

  async #mostRecentlyUsedCacheHash(): Promise<string | null> {
    const row = await this.#models.Blob.getRepository().findOne({
      where: { tier: BLOB_TIERS.CACHE },
      order: { lastAccessedAt: 'DESC', createdAt: 'DESC' },
    });
    return row?.hash ?? null;
  }

  async #touch(hash: string): Promise<void> {
    await this.#blobStore.touch(hash, { coalesceSeconds: RECENCY_COALESCE_SECONDS });
  }
}
