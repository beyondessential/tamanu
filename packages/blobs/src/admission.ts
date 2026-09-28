import {
  BLOB_INTEGRITY_STATES,
  BLOB_TIERS,
  CURRENT_BLOB_HASH_ALGORITHM,
  type BlobTier,
} from '@tamanu/constants';
import { BlobHashMismatchError, InsufficientStorageError, NotFoundError } from '@tamanu/errors';
// The package root, not the `blobs` subpath: metro resolves workspace packages by `main` and can't
// follow subpath exports.
import { formatBlobHash, parseBlobHash } from '@tamanu/utils';

export interface AdmissionResult {
  hash: string;
  size: number;
  existed: boolean;
}

export interface BlobAdmissionHost {
  hashFile(path: string, algorithm: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  fileSize(path: string): Promise<number>;
  /** After this returns, a reader sees whole content or none. */
  place(fromPath: string, toPath: string): Promise<void>;
  removeFile(path: string): Promise<void>;
  pathFor(hash: string): string;
  stagingPathFor(hash: string): string;
  stat(hash: string): Promise<{ size: number; integrityState?: string } | null>;
  /**
   * Atomic against a concurrent admission of the same content. A live row is left alone; a soft-
   * deleted row is resurrected with the incoming tier and fresh recency.
   */
  register(hash: string, size: number, tier: BlobTier): Promise<void>;
  storage(): Promise<{ free: number; reserve: number }>;
  evict?(bytesNeeded: number): Promise<void>;
  // spec: SCRUB
  /** Called after every commit, so it must leave an already-verified row alone. */
  markVerified?(hash: string, size: number): Promise<void>;
  insufficientStorageError?(details: {
    free: number;
    reserve: number;
    bytesNeeded: number;
  }): Error;
}

// spec: CAS, CAP
/**
 * Register only after placement, so a crash leaves an adoptable orphan rather than a row pointing
 * at missing bytes.
 */
export class BlobAdmission {
  #host: BlobAdmissionHost;

  constructor(host: BlobAdmissionHost) {
    this.#host = host;
  }

  // spec: CAS
  /** The hash comes from the bytes on disk, never from the caller. */
  async admitFile(
    tempPath: string,
    { tier = BLOB_TIERS.CACHE }: { tier?: BlobTier } = {},
  ): Promise<AdmissionResult> {
    await this.ensureFloor(0);

    const digest = await this.#host.hashFile(tempPath, CURRENT_BLOB_HASH_ALGORITHM);
    const hash = formatBlobHash(CURRENT_BLOB_HASH_ALGORITHM, digest);
    const size = await this.#host.fileSize(tempPath);

    const finalPath = this.#host.pathFor(hash);
    const existed = await this.#host.fileExists(finalPath);
    if (existed) {
      await this.#host.removeFile(tempPath);
    } else {
      await this.#host.place(tempPath, finalPath);
    }

    await this.#host.register(hash, size, tier);

    return { hash, size, existed };
  }

  // spec: XFER
  /** On mismatch the staging is discarded, so the next attempt starts clean. */
  async commitStaged(hash: string): Promise<AdmissionResult> {
    const { algorithm } = parseBlobHash(hash);
    const stagingPath = this.#host.stagingPathFor(hash);

    const existing = await this.#host.stat(hash);
    // spec: SCRUB
    // Only a verified copy counts as held. A corrupt copy falls through to be replaced.
    const heldAndTrusted =
      existing &&
      (existing.integrityState === undefined ||
        existing.integrityState === BLOB_INTEGRITY_STATES.VERIFIED);
    if (existing && heldAndTrusted) {
      await this.#host.removeFile(stagingPath);
      return { hash, size: existing.size, existed: true };
    }

    if (!(await this.#host.fileExists(stagingPath))) {
      throw new NotFoundError(`Nothing staged for blob: ${hash}`);
    }

    const digest = await this.#host.hashFile(stagingPath, algorithm);
    const actualHash = formatBlobHash(algorithm, digest);
    if (actualHash !== hash) {
      await this.#host.removeFile(stagingPath);
      throw new BlobHashMismatchError(
        `Staged content for ${hash} hashed to ${actualHash}; content discarded`,
      );
    }

    const size = await this.#host.fileSize(stagingPath);
    if (existing) {
      // spec: SCRUB
      // Placement treats an occupied destination as content already won, so the corrupt bytes go
      // first.
      await this.#host.removeFile(this.#host.pathFor(hash));
    }
    await this.#host.place(stagingPath, this.#host.pathFor(hash));
    await this.#host.register(hash, size, BLOB_TIERS.CACHE);
    // spec: SCRUB
    // Unconditional: registration leaves a live row's state alone, so nothing else would clear it.
    await this.#host.markVerified?.(hash, size);
    return { hash, size, existed: false };
  }

  // spec: CAP
  /** Measured against actual free space, so growth in the database or other consumers counts. */
  async ensureFloor(bytesNeeded: number): Promise<void> {
    let { free, reserve } = await this.#host.storage();
    if (free - bytesNeeded >= reserve) {
      return;
    }
    if (this.#host.evict) {
      await this.#host.evict(reserve + bytesNeeded - free);
      ({ free, reserve } = await this.#host.storage());
      if (free - bytesNeeded >= reserve) {
        return;
      }
    }
    const refusal = this.#host.insufficientStorageError?.({ free, reserve, bytesNeeded });
    if (refusal) {
      throw refusal;
    }
    throw new InsufficientStorageError(
      `Blob store refused new content: ${free} bytes free on volume, ${
        bytesNeeded ? `${bytesNeeded} needed, ` : ''
      }${reserve} reserved for the system`,
    );
  }
}
