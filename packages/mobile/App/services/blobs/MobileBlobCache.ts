import RNFS from 'react-native-fs';

import { BlobEviction } from '@tamanu/blobs';
import { BLOB_TIERS } from '@tamanu/constants';
import { BlobHashMismatchError, NotFoundError } from '@tamanu/errors';

import { Blob } from '~/models/Blob';
import { MobileBlobStore, BlobFileSystem, PutResult } from './MobileBlobStore';
import { deriveCacheBudgetBytes } from './deviceStorage';
import type { BlobTransferChannel } from './BlobTransferChannel';

// Reads within this window of the last recorded access don't rewrite recency.
// spec: CACHE — recency updates may be coalesced; losing the most recent
// refreshes degrades eviction ordering only.
const RECENCY_COALESCE_SECONDS = 60;

// spec: SCRUB
// Cache content confirmed to match its hash within this window is served without
// re-hashing. Long enough that browsing back and forth over a patient's photos
// hashes each file once, short enough that a corrupt cache copy is caught on a
// later visit. Outbox content is exempt and verified on every read.
const VERIFICATION_COALESCE_SECONDS = 60 * 60;

// Upper bound on cache rows scanned per eviction pass; a cache bigger than this
// is trimmed across successive passes.
const EVICTION_SCAN_LIMIT = 1000;

export interface MobileBlobCacheOptions {
  blobStore: MobileBlobStore;
  models: { Blob: typeof Blob };
  fs?: BlobFileSystem;
}

// spec: CACHE, MOB
// The device store's two durability tiers over the blob store primitive: the
// outbox (un-pushed content the device alone holds, never evicted) and the
// cache (durable on central, evictable under a size budget derived from the
// device's own storage). This class owns admission to the outbox, read-through
// with lazy fetch and verification, demotion once central acknowledges, and
// eviction; the post-sync pusher drives it from the outbox side (see
// BlobOutboxPusher).
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

  /** Wired once the central connection is up; reads work local-only without it. */
  setTransferChannel(transferChannel: BlobTransferChannel): void {
    this.#transferChannel = transferChannel;
  }

  // spec: CACHE, MOB
  /**
   * Admit device-captured content into the outbox, consuming the source file
   * so no second copy remains outside the store. Call within the operation
   * that creates the blob's referencing record; a blob stranded by a crash in
   * between is demoted to cache by the startup reconciliation. Content already
   * held as cache stays cache: it is already durable on central.
   */
  async putOutbox(sourcePath: string): Promise<PutResult> {
    return await this.#blobStore.putFile(sourcePath, { tier: BLOB_TIERS.OUTBOX });
  }

  // spec: MOB, SCRUB
  /**
   * Read-through: resolve the hash to a readable on-disk path, fetching from
   * the central server on a local miss and admitting the bytes to the cache
   * tier, so a later read of the same content needs no connectivity. Every
   * read verifies the bytes against the hash — the device runs no scheduled
   * scrub, so receipt and read verification carry integrity. Corrupt cache
   * content is dropped and refetched within the same read; corrupt outbox
   * content, the only copy of what the device captured, is retained and
   * surfaced as a fault.
   */
  async open(hash: string): Promise<string> {
    // spec: AV — checked before the fetch, so known-bad content is never pulled
    // onto the device in the first place, not merely refused once it is here.
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
      // Cache content is disposable: drop the corrupt copy and refetch.
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

  /** Read-through to the blob's content as base64, for inline display. */
  async readBase64(hash: string): Promise<string> {
    const path = await this.open(hash);
    return await this.#fs.readFile(path, 'base64');
  }

  // spec: SCRUB
  /**
   * Whether the content may be served as matching its hash. Content the device
   * alone holds is verified on every read, since corruption of it is unrecoverable
   * and must surface. Cache content, being refetchable, is verified no more often
   * than the coalescing window, so repeated reads of the same photo do not each
   * re-hash the whole file on a constrained device.
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
    // A fetch admission may take the cache over budget; enforcement never
    // evicts the most recently used blob, which the new arrival is.
    try {
      await this.enforceBudget();
    } catch (error) {
      console.warn(
        `MobileBlobCache.open: budget enforcement after fetch failed: ${error.message}`,
      );
    }
  }

  // spec: CACHE
  /** Move an acknowledged blob from outbox to cache: durable on central, evictable. */
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
   * Evict least-recently-used cache blobs until the cache fits its budget. The
   * budget is derived fresh from the device's storage on every enforcement, so
   * a device filling up with unrelated data gives cache space back rather than
   * holding to a budget it can no longer afford.
   */
  async enforceBudget(): Promise<{ evictedBytes: number; evictedCount: number }> {
    return await this.#eviction.enforceBudget();
  }

  // spec: CAP
  /** Free at least bytesNeeded for the free-disk floor. */
  async evictBytes(bytesNeeded: number): Promise<{ evictedBytes: number; evictedCount: number }> {
    return await this.#eviction.evictBytes(bytesNeeded);
  }

  // Outbox blobs are absent by construction: they are the only durable copy on
  // the device and are never eviction candidates.
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
