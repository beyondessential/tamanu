import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Transform, type Readable } from 'node:stream';

import { Op } from 'sequelize';

import { BlobAdmission } from '@tamanu/blobs';
import { BlobParity, type ErrorCorrectionSettings } from './BlobParity';
import {
  BLOB_HASH_ALGORITHMS,
  BLOB_INTEGRITY_STATES,
  BLOB_TIERS,
  type BlobIntegrityState,
  type BlobScanVerdict,
  type BlobTier,
} from '@tamanu/constants';
import {
  BlobHashMismatchError,
  InvalidParameterError,
  NotFoundError,
} from '@tamanu/errors';
import {
  blobHashFromPathSegments,
  blobPathSegments,
  formatBlobHash,
  parseBlobHash,
} from '@tamanu/utils/blobs';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import type { Blob } from '../models/Blob';

// NTFS refuses to rename over an existing file, and antivirus or indexer handles raise transient
// sharing violations.
const RETRIABLE_RENAME_CODES = ['EEXIST', 'EPERM', 'EACCES', 'EBUSY'];
const RENAME_ATTEMPTS = 5;
const RENAME_RETRY_BASE_MS = 50;

const FLOOR_CHECK_INTERVAL_BYTES = 64 * 1024 * 1024;

const TEMP_DIR = 'tmp';

// spec: XFER
const STAGING_DIR = 'staging';

export interface VolumeStats {
  bavail: number | bigint;
  bsize: number | bigint;
}

export interface BlobStoreOptions {
  root: string;
  models: { Blob: typeof Blob };
  getFreeDiskReserveBytes: () => Promise<number>;
  // spec: CAP
  evictCache?: (bytesNeeded: number) => Promise<void>;
  // spec: SCRUB
  onCorruptionDetected?: (hash: string) => Promise<void>;
  // spec: FEC
  errorCorrection?: {
    getSettings: () => Promise<ErrorCorrectionSettings>;
    coveredTiers: readonly BlobTier[];
  };
  log?: {
    error: (message: string, meta?: object) => void;
    warn?: (message: string, meta?: object) => void;
  };
  statfs?: (root: string) => Promise<VolumeStats>;
}

export interface ParityRetrofitResult {
  protected: boolean;
  bytesRead: number;
}

export interface PutResult {
  hash: string;
  size: number;
  existed: boolean;
}

export interface BlobStat {
  size: number;
  integrityState: string;
  scanVerdict: BlobScanVerdict | null;
}

export interface VerifyResult {
  held: boolean;
  matches: boolean;
  size: number;
  actualHash: string | null;
}

// spec: CAS, CAP
export class BlobStore {
  readonly root: string;

  readonly #models: { Blob: typeof Blob };
  readonly #getFreeDiskReserveBytes: () => Promise<number>;
  readonly #onCorruptionDetected?: (hash: string) => Promise<void>;
  readonly #log?: BlobStoreOptions['log'];
  readonly #statfs: (root: string) => Promise<VolumeStats>;
  readonly #stagingLocks = new Map<string, Promise<unknown>>();
  readonly #admission: BlobAdmission;
  readonly #parity?: BlobParity;

  constructor({
    root,
    models,
    getFreeDiskReserveBytes,
    evictCache,
    onCorruptionDetected,
    errorCorrection,
    log,
    statfs,
  }: BlobStoreOptions) {
    this.root = root;
    this.#models = models;
    this.#getFreeDiskReserveBytes = getFreeDiskReserveBytes;
    this.#onCorruptionDetected = onCorruptionDetected;
    this.#log = log;
    this.#statfs = statfs ?? (r => fs.statfs(r));
    this.#admission = new BlobAdmission({
      hashFile: (filePath, algorithm) => hashFile(filePath, algorithm),
      fileExists,
      fileSize: async filePath => (await fs.stat(filePath)).size,
      place: (fromPath, toPath) => this.#placeAtFinalPath(fromPath, toPath),
      removeFile: filePath => fs.rm(filePath, { force: true }),
      pathFor: hash => this.#pathFor(hash),
      stagingPathFor: hash => this.#stagingPathFor(hash),
      stat: hash => this.stat(hash),
      register: (hash, size, tier) => this.#register(hash, size, { tier }),
      storage: async () => ({
        free: await this.#volumeFreeBytes(),
        reserve: await this.#getFreeDiskReserveBytes(),
      }),
      ...(evictCache ? { evict: evictCache } : {}),
      // spec: SCRUB
      markVerified: async (hash, size) => {
        await this.#models.Blob.update(
          { integrityState: BLOB_INTEGRITY_STATES.VERIFIED, size, lastScrubbedAt: new Date() },
          { where: { hash, integrityState: { [Op.ne]: BLOB_INTEGRITY_STATES.VERIFIED } } },
        );
      },
    });
    if (errorCorrection) {
      this.#parity = new BlobParity({
        ...errorCorrection,
        pathFor: hash => this.#pathFor(hash),
        createTempPath: () => this.#createTempPath(),
        place: (fromPath, toPath) => this.#placeAtFinalPath(fromPath, toPath, { replace: true }),
        onWarning: (message, details) => this.#log?.warn?.(`BlobStore: ${message}`, details),
      });
    }
  }

  /**
   * A corrupt blob is present but never served. A malformed hash throws rather than reporting
   * absent.
   */
  async has(hash: string): Promise<boolean> {
    const filePath = this.#pathFor(hash);
    const registered = await this.#models.Blob.findOne({ where: { hash } });
    if (!registered) {
      return false;
    }
    return await fileExists(filePath);
  }

  // spec: SCRUB
  /** A whole read fails at end of stream on a hash mismatch; ranged reads are unverified. */
  async get(
    hash: string,
    {
      start,
      end,
      stat,
      verify = true,
    }: { start?: number; end?: number; stat?: BlobStat | null; verify?: boolean } = {},
  ): Promise<Readable> {
    const filePath = this.#pathFor(hash);
    const registered = stat ?? (await this.#models.Blob.findOne({ where: { hash } }));
    if (!registered) {
      // Bytes with no registry row are a crash orphan, not admitted content.
      throw new NotFoundError(`Blob not found: ${hash}`);
    }
    if (registered.integrityState === BLOB_INTEGRITY_STATES.CORRUPT) {
      throw new NotFoundError(`Blob is corrupt: ${hash}`);
    }
    let handle;
    try {
      handle = await fs.open(filePath, 'r');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError(`Blob not found: ${hash}`);
      }
      throw error;
    }
    const stream = handle.createReadStream({ start, end });
    const isWholeBlob = (start ?? 0) === 0 && end === undefined;
    if (!verify || !isWholeBlob) {
      return stream;
    }
    return verifyingStream(stream, hash, () => this.#onReadCorruption(hash));
  }

  async #onReadCorruption(hash: string): Promise<void> {
    if (!this.#onCorruptionDetected) {
      return;
    }
    try {
      await this.#onCorruptionDetected(hash);
    } catch (error) {
      // A failed heal must not mask the mismatch error the reader is about to see.
      this.#log?.error('BlobStore: self-heal after a failed read verification threw', {
        hash,
        error: (error as Error).message,
      });
    }
  }

  // spec: SCRUB
  /** Reads the file directly, so it can re-check corrupt content after a repair. */
  async verify(hash: string): Promise<VerifyResult> {
    const { algorithm } = parseBlobHash(hash);
    let handle;
    try {
      handle = await fs.open(this.#pathFor(hash), 'r');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { held: false, matches: false, size: 0, actualHash: null };
      }
      throw error;
    }

    const hasher = createHash(algorithm);
    let size = 0;
    try {
      for await (const chunk of handle.createReadStream({ autoClose: false })) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        hasher.update(buffer);
        size += buffer.length;
      }
    } finally {
      await handle.close();
    }

    const actualHash = formatBlobHash(algorithm, hasher.digest('hex'));
    return { held: true, matches: actualHash === hash, size, actualHash };
  }

  // spec: FEC
  async parityEnabled(): Promise<boolean> {
    return (await this.#parity?.enabled()) ?? false;
  }

  // spec: FEC
  async coversWithParity(blob: { size: number; tier: BlobTier }): Promise<boolean> {
    return (await this.#parity?.covers(blob)) ?? false;
  }

  // spec: FEC
  get parityCoverage(): { minimumSize: number; tiers: readonly BlobTier[] } {
    return this.#parity?.coverage ?? { minimumSize: 0, tiers: [] };
  }

  // spec: FEC
  /** Retrofits parity onto existing content. A blob that no longer matches its hash gets none. */
  async writeParity({
    hash,
    size,
    tier,
  }: {
    hash: string;
    size: number;
    tier: BlobTier;
  }): Promise<ParityRetrofitResult> {
    if (!this.#parity || !(await this.#parity.covers({ size, tier }))) {
      return { protected: false, bytesRead: 0 };
    }
    let outcome;
    try {
      outcome = await this.#parity.write(hash, this.#pathFor(hash), size);
    } catch (error) {
      this.#log?.error('BlobStore: parity write failed, blob remains unprotected', {
        hash,
        error: (error as Error).message,
      });
      return { protected: false, bytesRead: 0 };
    }
    if (!outcome.verified) {
      return { protected: false, bytesRead: outcome.bytesRead };
    }
    await this.#recordParityPresence(hash, true);
    return { protected: true, bytesRead: outcome.bytesRead };
  }

  // spec: FEC
  async discardParity(hash: string): Promise<void> {
    if (!this.#parity) {
      return;
    }
    await this.#parity.remove(hash);
    await this.#recordParityPresence(hash, false);
  }

  // spec: FEC
  /**
   * The reconstruction is always checked against the hash: a wrongly located damaged region
   * reconstructs "successfully" into different bytes.
   */
  async repairFromParity(hash: string): Promise<boolean> {
    if (!this.#parity) {
      return false;
    }
    const { algorithm } = parseBlobHash(hash);
    const tempPath = await this.#createTempPath();
    try {
      if (!(await this.#parity.reconstruct(hash, tempPath))) {
        return false;
      }
      const digest = await hashFile(tempPath, algorithm);
      if (formatBlobHash(algorithm, digest) !== hash) {
        this.#log?.error('BlobStore: reconstruction from parity did not match the blob hash', {
          hash,
        });
        return false;
      }
      // Atomic replace, so a reader never sees a partially repaired blob.
      await this.#placeAtFinalPath(tempPath, this.#pathFor(hash), { replace: true });
    } catch (error) {
      this.#log?.error('BlobStore: repair from parity failed', {
        hash,
        error: (error as Error).message,
      });
      return false;
    } finally {
      await fs.rm(tempPath, { force: true });
    }

    await this.#recordCorrection(hash);
    return true;
  }

  // spec: FEC
  async #recordCorrection(hash: string): Promise<void> {
    await this.#models.Blob.sequelize.query(
      `
        UPDATE blobs
        SET integrity_state = $integrityState,
            correction_count = correction_count + 1,
            last_corrected_at = now(),
            last_scrubbed_at = now(),
            updated_at = now()
        WHERE hash = $hash
      `,
      { bind: { hash, integrityState: BLOB_INTEGRITY_STATES.VERIFIED } },
    );
  }

  async #recordParityPresence(hash: string, hasParity: boolean): Promise<void> {
    await this.#models.Blob.update({ hasParity }, { where: { hash } });
  }

  // spec: SCRUB
  /** Walks the fan-out layout rather than the registry, so unregistered bytes are found. */
  async *storedHashes(): AsyncGenerator<string> {
    for (const algorithm of Object.values(BLOB_HASH_ALGORITHMS)) {
      const algorithmRoot = path.join(this.root, algorithm);
      for await (const filePath of walkFiles(algorithmRoot)) {
        const segments = path.relative(this.root, filePath).split(path.sep);
        const hash = blobHashFromPathSegments(segments);
        if (hash) {
          yield hash;
        }
      }
    }
  }

  // spec: SCRUB
  async recordIntegrityState(hash: string, integrityState: BlobIntegrityState): Promise<void> {
    await this.#models.Blob.update(
      { integrityState, lastScrubbedAt: new Date() },
      { where: { hash } },
    );
  }

  // spec: SCRUB
  /** Registering it absent stops the referential pass re-finding it every pass. */
  async recordAbsentReference(hash: string): Promise<void> {
    parseBlobHash(hash);
    // Size is unknown until the content arrives.
    await this.#register(hash, 0, { integrityState: BLOB_INTEGRITY_STATES.ABSENT });
  }

  // spec: SCRUB
  /** Never overwrites a corrupt row: a read-path corruption record landing mid-pass must win. */
  async recordVerified(hashes: string[]): Promise<void> {
    if (hashes.length === 0) {
      return;
    }
    await this.#models.Blob.update(
      { integrityState: BLOB_INTEGRITY_STATES.VERIFIED, lastScrubbedAt: new Date() },
      {
        where: {
          hash: hashes,
          integrityState: { [Op.ne]: BLOB_INTEGRITY_STATES.CORRUPT },
        },
      },
    );
  }

  // spec: SCRUB
  async touchScrubbed(hashes: string[]): Promise<void> {
    if (hashes.length === 0) {
      return;
    }
    await this.#models.Blob.update({ lastScrubbedAt: new Date() }, { where: { hash: hashes } });
  }

  // spec: SCRUB
  /**
   * For bytes already in their fan-out path, e.g. after a crash between placing and registering.
   * The caller has verified them.
   */
  async adopt(hash: string, size: number): Promise<void> {
    await this.#register(hash, size);
  }

  async stat(hash: string): Promise<BlobStat | null> {
    const registered = await this.#models.Blob.findOne({ where: { hash } });
    if (!registered || !(await fileExists(this.#pathFor(hash)))) {
      return null;
    }
    return {
      size: registered.size,
      integrityState: registered.integrityState,
      scanVerdict: registered.scanVerdict ?? null,
    };
  }

  // spec: AV
  async recordScanVerdict(
    hash: string,
    {
      verdict,
      scannerVersion,
      signatureVersion,
    }: { verdict: BlobScanVerdict; scannerVersion: string; signatureVersion: string },
  ): Promise<void> {
    await this.#models.Blob.update(
      { scanVerdict: verdict, scannedAt: new Date(), scannerVersion, signatureVersion },
      { where: { hash } },
    );
  }

  // spec: SCRUB
  /** Corrupt and absent copies count as not held, so a facility refetch replaces them. */
  async servableStat(hash: string): Promise<BlobStat | null> {
    const held = await this.stat(hash);
    // An allow-list, so a new state is withheld until deliberately allowed.
    if (held?.integrityState !== BLOB_INTEGRITY_STATES.VERIFIED) {
      return null;
    }
    return held;
  }

  /**
   * Idempotent: identical content resolves to the stored blob and keeps its tier, even if corrupt.
   * Refuses below the free-disk reserve. The source stream is destroyed on failure.
   */
  async put(
    source: Readable,
    options: { sizeHint?: number; tier?: BlobTier } = {},
  ): Promise<PutResult> {
    try {
      return await this.#admit(source, options);
    } catch (error) {
      source.destroy();
      throw error;
    }
  }

  async #admit(
    source: Readable,
    { sizeHint, tier }: { sizeHint?: number; tier?: BlobTier },
  ): Promise<PutResult> {
    const admittedTier = tier ?? BLOB_TIERS.CACHE;
    const tempPath = await this.#createTempPath();
    await this.#ensureFloor(await this.#admissionBytesNeeded(sizeHint ?? 0, admittedTier));

    try {
      await this.#writeTemp(source, tempPath);
    } catch (error) {
      await fs.rm(tempPath, { force: true });
      throw error;
    }

    let result;
    try {
      result = await this.#admission.admitFile(tempPath, { tier: admittedTier });
    } catch (error) {
      await fs.rm(tempPath, { force: true });
      throw error;
    }

    await this.#writeParityOnAdmission(result);
    return result;
  }

  // spec: CAP
  /** Includes the parity sidecar, or a covered admission could dip into the reserve. */
  async #admissionBytesNeeded(sizeHint: number, tier: BlobTier): Promise<number> {
    if (sizeHint === 0 || !(await this.#parity?.covers({ size: sizeHint, tier }))) {
      return sizeHint;
    }
    return sizeHint + (await this.#parity!.sidecarBytesFor(sizeHint));
  }

  // spec: FEC
  /** A parity failure doesn't fail the admission; the scrub adds parity later. */
  async #writeParityOnAdmission({ hash, size, existed }: PutResult): Promise<void> {
    if (existed || !this.#parity || !(await this.#parity.enabled())) {
      return;
    }
    try {
      // The registered tier, not the requested one: a live row keeps its own.
      const registered = await this.#models.Blob.findOne({ where: { hash } });
      if (!registered || !(await this.#parity.covers({ size, tier: registered.tier }))) {
        return;
      }
      await this.#ensureFloor(await this.#parity.sidecarBytesFor(size));
      const { verified } = await this.#parity.write(hash, this.#pathFor(hash), size);
      if (!verified) {
        this.#log?.error('BlobStore: admitted content no longer matches its hash', { hash });
        return;
      }
      await this.#recordParityPresence(hash, true);
    } catch (error) {
      this.#log?.error('BlobStore: parity write failed, blob is stored unprotected', {
        hash,
        error: (error as Error).message,
      });
    }
  }

  async #createTempPath(): Promise<string> {
    const tempDir = path.join(this.root, TEMP_DIR);
    await fs.mkdir(tempDir, { recursive: true });
    return path.join(tempDir, randomUUID());
  }

  // spec: XFER
  async stagedSize(hash: string): Promise<number> {
    const stagingPath = this.#stagingPathFor(hash);
    try {
      const stats = await fs.stat(stagingPath);
      return stats.size;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return 0;
      }
      throw error;
    }
  }

  // spec: XFER
  /**
   * `offset` must equal the bytes already staged, or nothing is written.
   * Exceeding `maxBytes` discards the staging and throws.
   */
  async stage(
    hash: string,
    source: Readable,
    { offset, maxBytes }: { offset: number; maxBytes?: number },
  ): Promise<{ stagedSize: number }> {
    parseBlobHash(hash);
    return await this.#withStagingLock(hash, () =>
      this.#stageLocked(hash, source, { offset, maxBytes }),
    );
  }

  async #stageLocked(
    hash: string,
    source: Readable,
    { offset, maxBytes }: { offset: number; maxBytes?: number },
  ): Promise<{ stagedSize: number }> {
    const stagingPath = this.#stagingPathFor(hash);
    await fs.mkdir(path.dirname(stagingPath), { recursive: true });

    const alreadyStaged = await this.stagedSize(hash);
    if (offset !== alreadyStaged) {
      throw new InvalidParameterError(
        `Staged content offset mismatch for ${hash}: ${alreadyStaged} bytes staged, offset ${offset} delivered`,
      );
    }

    await this.#ensureFloor(0);

    let written = 0;
    let bytesSinceFloorCheck = 0;
    let overran = false;
    const handle = await fs.open(stagingPath, 'a');
    try {
      for await (const chunk of source) {
        if (overran) {
          // Keep draining: destroying the source mid-body tears down the socket, which the
          // response-logging middleware then dereferences.
          continue;
        }
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (maxBytes !== undefined && written + buffer.length > maxBytes) {
          overran = true;
          continue;
        }
        written += buffer.length;
        bytesSinceFloorCheck += buffer.length;
        await writeAll(handle, buffer);
        if (bytesSinceFloorCheck >= FLOOR_CHECK_INTERVAL_BYTES) {
          bytesSinceFloorCheck = 0;
          await this.#ensureFloor(0);
        }
      }
      await handle.sync();
    } finally {
      await handle.close();
    }

    if (overran) {
      await this.#removeStagingFile(hash);
      throw new InvalidParameterError(
        `Staged content for ${hash} exceeded the declared ${maxBytes} remaining bytes; staging discarded`,
      );
    }

    return { stagedSize: alreadyStaged + written };
  }

  // spec: XFER
  /** On mismatch the staging is discarded and BlobHashMismatchError thrown. */
  async commitStaged(hash: string): Promise<PutResult> {
    parseBlobHash(hash);
    const result = await this.#withStagingLock(hash, () => this.#commitStagedLocked(hash));
    // Outside the staging lock, so transfers of the same hash don't serialise on an encode.
    await this.#writeParityOnAdmission(result);
    return result;
  }

  async #commitStagedLocked(hash: string): Promise<PutResult> {
    return await this.#admission.commitStaged(hash);
  }

  // spec: XFER
  async discardStaged(hash: string): Promise<void> {
    await this.#withStagingLock(hash, () => this.#removeStagingFile(hash));
  }

  async #removeStagingFile(hash: string): Promise<void> {
    await fs.rm(this.#stagingPathFor(hash), { force: true });
  }

  // spec: CACHE
  /**
   * No-op while the last access is within the window, so hot blobs don't rewrite the registry on
   * every read.
   */
  async touch(hash: string, { coalesceSeconds }: { coalesceSeconds: number }): Promise<void> {
    await this.#models.Blob.sequelize.query(
      `
        UPDATE blobs
        SET last_accessed_at = now()
        WHERE hash = $hash
          AND last_accessed_at < now() - make_interval(secs => $coalesceSeconds)
      `,
      { bind: { hash, coalesceSeconds } },
    );
  }

  async delete(hash: string): Promise<void> {
    const filePath = this.#pathFor(hash);
    // spec: FEC
    // Before deleting the row, which is what records that the sidecar exists.
    await this.discardParity(hash);
    // Hard delete: a soft-deleted row would shadow re-admission. Registry first, so a crash leaves
    // an adoptable orphan.
    await this.#models.Blob.destroy({ where: { hash }, force: true });
    try {
      await fs.rm(filePath, { force: true });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? '';
      // Windows can't unlink a file a reader holds open; it's left as an adoptable orphan.
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(code)) {
        throw error;
      }
    }
  }

  #pathFor(hash: string): string {
    return path.join(this.root, ...blobPathSegments(hash));
  }

  // spec: XFER
  // Serialised per hash within this process only; commit verification is the backstop across
  // processes.
  async #withStagingLock<T>(hash: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.#stagingLocks.get(hash) ?? Promise.resolve();
    const run = previous.catch(() => {}).then(operation);
    const tail = run.catch(() => {});
    this.#stagingLocks.set(hash, tail);
    try {
      return await run;
    } finally {
      if (this.#stagingLocks.get(hash) === tail) {
        this.#stagingLocks.delete(hash);
      }
    }
  }

  #stagingPathFor(hash: string): string {
    const { algorithm, digest } = parseBlobHash(hash);
    return path.join(this.root, STAGING_DIR, `${algorithm}-${digest}`);
  }

  async #writeTemp(source: Readable, tempPath: string): Promise<void> {
    let bytesSinceFloorCheck = 0;

    // Write through the handle: a write stream from it holds a reference handle.close() never
    // resolves past.
    const handle = await fs.open(tempPath, 'wx');
    try {
      for await (const chunk of source) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytesSinceFloorCheck += buffer.length;
        await writeAll(handle, buffer);
        if (bytesSinceFloorCheck >= FLOOR_CHECK_INTERVAL_BYTES) {
          bytesSinceFloorCheck = 0;
          await this.#ensureFloor(0);
        }
      }
      // Flush before rename so a crash cannot leave a fully-named partial blob.
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  /**
   * `replace` overwrites an occupant. Windows refuses to rename over one, so it's removed first.
   */
  async #placeAtFinalPath(
    tempPath: string,
    finalPath: string,
    { replace = false }: { replace?: boolean } = {},
  ): Promise<void> {
    await fs.mkdir(path.dirname(finalPath), { recursive: true });

    for (let attempt = 1; ; attempt++) {
      try {
        await fs.rename(tempPath, finalPath);
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code ?? '';
        if (!RETRIABLE_RENAME_CODES.includes(code)) {
          await fs.rm(tempPath, { force: true });
          throw error;
        }
        if (await fileExists(finalPath)) {
          if (replace) {
            // On Windows a held destination fails the next rename, so the retry cap bounds the
            // wait.
            await fs.rm(finalPath, { force: true }).catch(() => {});
          } else {
            // A concurrent put of the same content won; ours is redundant.
            await fs.rm(tempPath, { force: true });
            return;
          }
        }
        if (attempt >= RENAME_ATTEMPTS) {
          await fs.rm(tempPath, { force: true });
          throw error;
        }
        await sleepAsync(RENAME_RETRY_BASE_MS * attempt);
      }
    }

    // Windows can't fsync a directory; NTFS journals the rename.
    try {
      const dirHandle = await fs.open(path.dirname(finalPath), 'r');
      try {
        await dirHandle.sync();
      } finally {
        await dirHandle.close();
      }
    } catch {
      // ignore: platform cannot fsync directories
    }
  }

  async #register(
    hash: string,
    size: number,
    { tier, integrityState }: { tier?: BlobTier; integrityState?: BlobIntegrityState } = {},
  ): Promise<void> {
    // Resurrects a soft-deleted row, which still holds the unique index, with the incoming tier and
    // fresh recency.
    // Stamps the scrub time so fresh content doesn't jump the scrub queue.
    await this.#models.Blob.sequelize.query(
      `
        INSERT INTO blobs (id, hash, size, integrity_state, tier, last_scrubbed_at)
        VALUES ($id, $hash, $size, $integrityState, $tier, now())
        ON CONFLICT (hash) DO UPDATE
          SET deleted_at = NULL,
              updated_at = now(),
              last_accessed_at = now(),
              last_scrubbed_at = now(),
              tier = EXCLUDED.tier
          WHERE blobs.deleted_at IS NOT NULL
      `,
      {
        bind: {
          id: randomUUID(),
          hash,
          size,
          integrityState: integrityState ?? BLOB_INTEGRITY_STATES.VERIFIED,
          tier: tier ?? BLOB_TIERS.CACHE,
        },
      },
    );
  }

  async #ensureFloor(bytesNeeded: number): Promise<void> {
    await this.#admission.ensureFloor(bytesNeeded);
  }

  async #volumeFreeBytes(): Promise<number> {
    const stats = await this.#statfs(this.root);
    return Number(stats.bavail) * Number(stats.bsize);
  }
}

// A write can persist fewer bytes than given as the volume fills, so loop until it's all down.
async function writeAll(handle: fs.FileHandle, buffer: Buffer): Promise<void> {
  for (let offset = 0; offset < buffer.length; ) {
    const { bytesWritten } = await handle.write(buffer, offset);
    if (bytesWritten <= 0) {
      throw new Error(`Blob write stalled at ${offset}/${buffer.length} bytes`);
    }
    offset += bytesWritten;
  }
}

async function hashFile(filePath: string, algorithm: string): Promise<string> {
  const handle = await fs.open(filePath, 'r');
  const hasher = createHash(algorithm);
  try {
    for await (const chunk of handle.createReadStream({ autoClose: false })) {
      hasher.update(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
  } finally {
    await handle.close();
  }
  return hasher.digest('hex');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// spec: SCRUB
function verifyingStream(source: Readable, hash: string, onMismatch: () => Promise<void>): Readable {
  const { algorithm } = parseBlobHash(hash);
  const hasher = createHash(algorithm);
  const verifier = new Transform({
    transform(chunk, _encoding, callback) {
      hasher.update(chunk);
      callback(null, chunk);
    },
    flush(callback) {
      const actualHash = formatBlobHash(algorithm, hasher.digest('hex'));
      if (actualHash === hash) {
        callback();
        return;
      }
      // Heal in the background: the reader's error mustn't wait on it, and it mustn't be skipped if
      // the reader gives up.
      void onMismatch();
      callback(
        new BlobHashMismatchError(`Stored content for ${hash} hashed to ${actualHash} on read`),
      );
    },
  });
  // A read error must reach the reader rather than end the stream cleanly.
  verifier.on('close', () => source.destroy());
  source.on('error', error => verifier.destroy(error));
  return source.pipe(verifier);
}

// A missing directory is empty: an algorithm's tree exists only once content is stored under it.
async function* walkFiles(directory: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(entryPath);
    } else if (entry.isFile()) {
      yield entryPath;
    }
  }
}
