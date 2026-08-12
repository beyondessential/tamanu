import {
  BLOB_INTEGRITY_STATES,
  BLOB_TIERS,
  CURRENT_BLOB_HASH_ALGORITHM,
  type BlobTier,
} from '@tamanu/constants';
import { BlobHashMismatchError, InsufficientStorageError, NotFoundError } from '@tamanu/errors';
import { formatBlobHash, parseBlobHash } from '@tamanu/utils/blobs';

export interface AdmissionResult {
  hash: string;
  size: number;
  /** True when identical content was already stored, making this admission a no-op. */
  existed: boolean;
}

/**
 * The store IO the admission ordering drives. Paths are opaque strings the host
 * hands back to itself; the package decides the sequence, never the bytes.
 */
export interface BlobAdmissionHost {
  /** Hex digest of the file's bytes under the named algorithm. */
  hashFile(path: string, algorithm: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  fileSize(path: string): Promise<number>;
  /** Atomic placement: after this returns, a reader sees whole content or none. */
  place(fromPath: string, toPath: string): Promise<void>;
  removeFile(path: string): Promise<void>;
  pathFor(hash: string): string;
  stagingPathFor(hash: string): string;
  stat(hash: string): Promise<{ size: number; integrityState?: string } | null>;
  /**
   * Registry upsert. Contract, since hosts implement it in different dialects:
   * atomic against a concurrent admission of the same content; a live row is
   * left entirely alone, so a tier the admission needs applied is the caller's
   * to set; a soft-deleted row is resurrected with the incoming tier and its
   * recency reset to now.
   */
  register(hash: string, size: number, tier: BlobTier): Promise<void>;
  /**
   * Free space on the volume the store root sits on, and the free space the
   * store must leave available on it. Read together, since a host may derive
   * both from one look at its storage.
   */
  storage(): Promise<{ free: number; reserve: number }>;
  /** Asked to free at least bytesNeeded before the store refuses. */
  evict?(bytesNeeded: number): Promise<void>;
  /**
   * spec: SCRUB — bring a row that was corrupt or standing as absent back to
   * verified, now that these bytes have verified. Called after every commit, so
   * it must leave an already-verified row alone. Hosts that don't track
   * integrity state omit it.
   */
  markVerified?(hash: string, size: number): Promise<void>;
  /**
   * The refusal, when the host words it for its own audience (a device speaks
   * of its storage, a server of its volume). Defaults to an
   * InsufficientStorageError.
   */
  insufficientStorageError?(details: {
    free: number;
    reserve: number;
    bytesNeeded: number;
  }): Error;
}

// spec: CAS, CAP
/**
 * The content-addressed store's admission ordering: hash the written bytes,
 * place them at their fan-out path, and only then register, so a crash leaves an
 * adoptable orphan rather than a row pointing at missing bytes.
 */
export class BlobAdmission {
  #host: BlobAdmissionHost;

  constructor(host: BlobAdmissionHost) {
    this.#host = host;
  }

  // spec: CAS
  /**
   * Admit content the host has already written to `tempPath`. The hash comes
   * from the bytes on disk, never from one a caller supplied, so what is
   * recorded is provably what is stored. Idempotent: identical content resolves
   * to the one stored blob, keeping its existing tier.
   */
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

    // Register after placement: a crash in between leaves an orphan file that
    // the next admission of the same content adopts, never a registry row
    // pointing at missing bytes.
    await this.#host.register(hash, size, tier);

    return { hash, size, existed };
  }

  // spec: XFER
  /**
   * Verify staged content against its hash and admit it. Verification covers the
   * complete staged file, including bytes delivered before an interruption. On
   * mismatch the staging is discarded, so the next attempt starts clean.
   * Idempotent: a hash the store already holds commits as a no-op.
   */
  async commitStaged(hash: string): Promise<AdmissionResult> {
    const { algorithm } = parseBlobHash(hash);
    const stagingPath = this.#host.stagingPathFor(hash);

    const existing = await this.#host.stat(hash);
    // spec: SCRUB — only a copy already verified counts as content held; the
    // commit is a no-op against it. A corrupt copy is exactly what an
    // incoming good copy is there to replace, so it falls through and its bytes
    // and state are only settled once the replacement verifies below.
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
      // spec: SCRUB — the replacement has verified, so the corrupt bytes go
      // now. Removing them first is what lets the placement below land, since
      // placement treats an occupied destination as content already won.
      await this.#host.removeFile(this.#host.pathFor(hash));
    }
    await this.#host.place(stagingPath, this.#host.pathFor(hash));
    await this.#host.register(hash, size, BLOB_TIERS.CACHE);
    // spec: SCRUB — these bytes just verified, so a row still standing as
    // corrupt or absent is now out of date. Unconditional because the row a
    // refetch heals is one whose bytes had gone, which reads as nothing held at
    // all; registration leaves a live row's state alone, so nothing else would
    // clear it.
    await this.#host.markVerified?.(hash, size);
    return { hash, size, existed: false };
  }

  // spec: CAP
  /**
   * Keep the volume's free space above the reserve, measured against actual free
   * space so growth in the database or other consumers is accounted for. Evict
   * cache first where a hook is available; refuse rather than cross into the
   * reserve.
   */
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
