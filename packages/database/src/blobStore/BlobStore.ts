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

// Windows/NTFS refuses to rename over an existing file (EEXIST/EPERM), and
// antivirus or indexer handles can surface transient sharing violations
// (EPERM/EBUSY) even on a fresh destination; POSIX never raises these here.
const RETRIABLE_RENAME_CODES = ['EEXIST', 'EPERM', 'EACCES', 'EBUSY'];
const RENAME_ATTEMPTS = 5;
const RENAME_RETRY_BASE_MS = 50;

// How often the free-disk floor is rechecked while streaming content of
// unknown size, so a very large put aborts early instead of filling the volume
// before the post-write check.
const FLOOR_CHECK_INTERVAL_BYTES = 64 * 1024 * 1024;

const TEMP_DIR = 'tmp';

// spec: XFER
// Partially received transfers live here, named by their offered hash, so an
// interrupted transfer resumes from the bytes already delivered — including
// across a server restart.
const STAGING_DIR = 'staging';

export interface VolumeStats {
  bavail: number | bigint;
  bsize: number | bigint;
}

export interface BlobStoreOptions {
  /** Store root directory; may sit on a separate volume from the database. */
  root: string;
  models: { Blob: typeof Blob };
  /** Free disk space (bytes) the store must leave available on its volume. */
  getFreeDiskReserveBytes: () => Promise<number>;
  /**
   * Cache-eviction hook (spec: CAP): asked to free at least bytesNeeded before
   * the store refuses a new blob. Supplied by the facility cache tier; absent
   * on servers with nothing evictable.
   */
  evictCache?: (bytesNeeded: number) => Promise<void>;
  /**
   * Self-heal hook (spec: SCRUB): called with the hash of a blob whose bytes
   * failed verification on the read path. Supplied by the server, which owns
   * severity grading and the repair ladder.
   */
  onCorruptionDetected?: (hash: string) => Promise<void>;
  /**
   * Error correction (spec: FEC): the per-server settings and the tiers this
   * server's coverage includes. Absent on a server that carries no parity.
   */
  errorCorrection?: {
    getSettings: () => Promise<ErrorCorrectionSettings>;
    coveredTiers: readonly BlobTier[];
  };
  log?: {
    error: (message: string, meta?: object) => void;
    warn?: (message: string, meta?: object) => void;
  };
  /** Injectable for tests; defaults to fs.statfs on the store root. */
  statfs?: (root: string) => Promise<VolumeStats>;
}

export interface PutResult {
  hash: string;
  size: number;
  /** True when identical content was already stored, making this put a no-op. */
  existed: boolean;
}

export interface BlobStat {
  size: number;
  integrityState: string;
}

export interface VerifyResult {
  /** Whether the store holds bytes for the hash at all. */
  held: boolean;
  matches: boolean;
  size: number;
  /** What the held bytes actually hash to, or null when none are held. */
  actualHash: string | null;
}

// spec: CAS, CAP
// The content-addressed blob store primitive: bytes on disk under an
// algorithm-namespaced two-level fan-out, and a row per blob in the local
// `blobs` registry. Consumers (attachments, assets), transfer, and cache
// management live elsewhere; this class owns storage, identity, and the
// free-disk floor.
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
      // spec: SCRUB — these bytes just verified, so a row still standing as
      // quarantined or absent is now out of date. A row already verified is
      // left alone.
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
   * Presence, not servability: a quarantined blob is present (has → true) but
   * is never served (get refuses). A malformed hash throws rather than
   * reporting absent, on every operation alike.
   */
  async has(hash: string): Promise<boolean> {
    const filePath = this.#pathFor(hash);
    const registered = await this.#models.Blob.findOne({ where: { hash } });
    if (!registered) {
      return false;
    }
    return await fileExists(filePath);
  }

  /**
   * Stream a blob's bytes.
   *
   * spec: SCRUB — a read of the whole blob re-verifies it: the bytes are hashed
   * as they stream and the stream fails at the end if they do not match, so
   * corrupt content is never served as complete. A ranged read cannot be
   * verified this way and relies on receipt verification and the scrub instead.
   * `verify: false` opts out for callers that are themselves the verification
   * (the scrub) or that must read quarantined bytes.
   */
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
    // A caller that has just run stat() for this hash (the serving path, which
    // needs the size for range handling) passes it back so the primary read
    // path queries the registry once, not twice.
    const registered = stat ?? (await this.#models.Blob.findOne({ where: { hash } }));
    if (!registered) {
      // Bytes with no registry row are a crash orphan, not admitted content.
      throw new NotFoundError(`Blob not found: ${hash}`);
    }
    if (registered.integrityState === BLOB_INTEGRITY_STATES.QUARANTINED) {
      // Quarantined content is retained for investigation but never served.
      throw new NotFoundError(`Blob is quarantined: ${hash}`);
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
    // A read bounded at either end covers part of the content, so its bytes
    // cannot be checked against a hash of the whole.
    const isWholeBlob = (start ?? 0) === 0 && end === undefined;
    if (!verify || !isWholeBlob) {
      return stream;
    }
    return verifyingStream(stream, hash, () => this.#onReadCorruption(hash));
  }

  async #onReadCorruption(hash: string): Promise<void> {
    // The read path detects; the healer decides severity and repair, since that
    // differs between an authoritative copy and a refetchable cache one.
    if (!this.#onCorruptionDetected) {
      return;
    }
    try {
      await this.#onCorruptionDetected(hash);
    } catch (error) {
      // A failed heal must not replace the mismatch error the reader is about
      // to see with one about the repair attempt.
      this.#log?.error('BlobStore: self-heal after a failed read verification threw', {
        hash,
        error: (error as Error).message,
      });
    }
  }

  // spec: SCRUB
  /**
   * Re-hash the stored bytes for a hash and report whether they still match it.
   * Reads the file directly, so it verifies quarantined content too — a repair
   * needs to be able to re-check what it replaced.
   */
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
  /** Whether error correction is on for this server at all. */
  async parityEnabled(): Promise<boolean> {
    return (await this.#parity?.enabled()) ?? false;
  }

  // spec: FEC
  /** Whether this server carries parity for a blob, by its tier and its size. */
  async coversWithParity(blob: { size: number; tier: BlobTier }): Promise<boolean> {
    return (await this.#parity?.covers(blob)) ?? false;
  }

  // spec: FEC
  /**
   * The blobs this server could carry parity for, as bounds a query can narrow
   * to. `coversWithParity` stays the per-blob authority; this only keeps a scan
   * off the rows it would refuse.
   */
  get parityCoverage(): { minimumSize: number; tiers: readonly BlobTier[] } {
    return this.#parity?.coverage ?? { minimumSize: 0, tiers: [] };
  }

  // spec: FEC
  /**
   * Compute and store parity for a covered blob the store already holds — the
   * scrub's retrofit, which is what brings content admitted before error
   * correction was enabled under protection. Returns whether parity now exists.
   */
  async writeParity({
    hash,
    size,
    tier,
  }: {
    hash: string;
    size: number;
    tier: BlobTier;
  }): Promise<boolean> {
    if (!this.#parity || !(await this.#parity.covers({ size, tier }))) {
      return false;
    }
    try {
      await this.#parity.write(hash, this.#pathFor(hash), size);
    } catch (error) {
      this.#log?.error('BlobStore: parity write failed, blob remains unprotected', {
        hash,
        error: (error as Error).message,
      });
      return false;
    }
    await this.#recordParityPresence(hash, true);
    return true;
  }

  // spec: FEC
  /**
   * Drop a blob's parity. Parity is derived from content this server no longer
   * needs to protect: the blob has gone, or it has been demoted out of the outbox
   * and is now durable on central.
   */
  async discardParity(hash: string): Promise<void> {
    if (!this.#parity) {
      return;
    }
    await this.#parity.remove(hash);
    await this.#recordParityPresence(hash, false);
  }

  // spec: FEC
  /**
   * Repair a blob from its parity, correcting the bytes on disk rather than only
   * the bytes served. Returns whether the blob is now whole.
   *
   * The reconstruction is verified against the blob's hash unconditionally, and
   * one that does not match is discarded: locating the damaged region is part of
   * the repair, and a region located wrongly reconstructs "successfully" into
   * different bytes, which the hash is the only check that detects.
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
      // Placed by the same atomic move admission uses, replacing the damaged
      // bytes, so a reader never observes a partially repaired blob.
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
  // A repair is recorded against the blob so the rate of correction over a period
  // can be derived: a rising rate is failing media, which calls for replacing the
  // disk rather than for recovering content.
  //
  // The blob is recorded verified — the reconstruction was checked against its
  // hash — and so is neither quarantined nor escalated.
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
  /**
   * Every hash the store holds bytes for, read from the fan-out layout rather
   * than the registry, so bytes no registry entry names are found. Yields as it
   * walks: a store with a very large population is never materialised whole.
   * Paths that do not parse as a hash are skipped — the staging and temp
   * directories live under the same root, and neither is content.
   */
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
  /**
   * Record a blob's standing against its hash, stamping the scrub time. The
   * result of a scrub is the state it leaves behind, so the two are written
   * together and never drift.
   */
  async recordIntegrityState(hash: string, integrityState: BlobIntegrityState): Promise<void> {
    await this.#models.Blob.update(
      { integrityState, lastScrubbedAt: new Date() },
      { where: { hash } },
    );
  }

  // spec: SCRUB
  /**
   * Record content this store is expected to be able to serve but holds no
   * registry row for at all — the referential pass's fault, where a
   * synchronised record references a hash the store has never admitted.
   *
   * Registering it absent is what makes the fault visible to everything that
   * reads the registry, and it stops the referential pass re-finding the same
   * hash every pass and spending its limit on it. From here the ordinary absent
   * machinery applies: cheap to re-check (there are no bytes to hash), and an
   * arriving copy settles it on commit, size included.
   */
  async recordAbsentReference(hash: string): Promise<void> {
    parseBlobHash(hash);
    // Size is unknown until the content arrives; the commit that admits it
    // writes the real one.
    await this.#register(hash, 0, { integrityState: BLOB_INTEGRITY_STATES.ABSENT });
  }

  // spec: SCRUB
  /**
   * Stamp a batch of blobs as verified as of now, in one statement. The scrub's
   * common case is that most blobs pass, so this keeps a pass to a single write
   * for the verified set rather than one per blob.
   *
   * spec: SCRUB — a read-path quarantine landing between a blob's verify() and
   * this end-of-pass flush must win: its bytes are known-bad now, whatever they
   * hashed to earlier in the pass. So this never overwrites a quarantined row,
   * only the verified/absent ones the scrub actually re-checked.
   */
  async recordVerified(hashes: string[]): Promise<void> {
    if (hashes.length === 0) {
      return;
    }
    await this.#models.Blob.update(
      { integrityState: BLOB_INTEGRITY_STATES.VERIFIED, lastScrubbedAt: new Date() },
      {
        where: {
          hash: hashes,
          integrityState: { [Op.ne]: BLOB_INTEGRITY_STATES.QUARANTINED },
        },
      },
    );
  }

  // spec: SCRUB
  /**
   * Record that a batch of blobs was scrubbed just now without changing their
   * integrity state — for a fault the scrub re-checked and found unchanged, so
   * it moves to the back of the least-recently-scrubbed queue rather than being
   * re-examined every pass.
   */
  async touchScrubbed(hashes: string[]): Promise<void> {
    if (hashes.length === 0) {
      return;
    }
    await this.#models.Blob.update({ lastScrubbedAt: new Date() }, { where: { hash: hashes } });
  }

  // spec: SCRUB
  /**
   * Register bytes already sitting in their fan-out path — content admitted by
   * a process that died between placing the file and recording it, or restored
   * from a store backup taken after its database. The caller has verified the
   * bytes against the hash their location encodes.
   */
  async adopt(hash: string, size: number): Promise<void> {
    await this.#register(hash, size);
  }

  /** The registry's record of a held blob, or null when the blob is not held. */
  async stat(hash: string): Promise<BlobStat | null> {
    const registered = await this.#models.Blob.findOne({ where: { hash } });
    if (!registered || !(await fileExists(this.#pathFor(hash)))) {
      return null;
    }
    return { size: registered.size, integrityState: registered.integrityState };
  }

  // spec: SCRUB
  /**
   * The registry's record of a blob this store can serve. A quarantined or
   * absent copy is retained but never served, so every read path treats it as
   * not held: that is what withholds the bad bytes, keeps the state itself
   * undisclosed, and on a facility lets a refetch replace the copy rather than
   * the read failing against it.
   */
  async servableStat(hash: string): Promise<BlobStat | null> {
    const held = await this.stat(hash);
    // An allow-list, so a state added later is withheld until it is
    // deliberately allowed rather than served by omission.
    if (held?.integrityState !== BLOB_INTEGRITY_STATES.VERIFIED) {
      return null;
    }
    return held;
  }

  /**
   * Admit content into the store: stream it to a temporary file within the
   * store, hash what landed there, then atomically rename into the fan-out path
   * and record it in the registry. Idempotent — identical content resolves to the one
   * stored blob, keeping its existing tier (spec: CACHE — content already held
   * as cache stays cache). Refuses (InsufficientStorageError) rather than take
   * the volume's free space below the configured reserve. On any failure the
   * source stream is destroyed; it cannot be reused.
   *
   * Cannot replace bytes already stored under the hash: an existing blob wins
   * (`existed: true`), including a quarantined one, whose corrupt bytes and
   * state are kept. Repair is delete-then-put.
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
  /**
   * What admission has to fit: the blob, plus the parity it will carry where this
   * server covers it. Reserving only the blob would let a covered admission take
   * the volume into the reserve by the size of its sidecar.
   */
  async #admissionBytesNeeded(sizeHint: number, tier: BlobTier): Promise<number> {
    if (sizeHint === 0 || !(await this.#parity?.covers({ size: sizeHint, tier }))) {
      return sizeHint;
    }
    return sizeHint + (await this.#parity!.sidecarBytesFor(sizeHint));
  }

  // spec: FEC
  /**
   * Parity for freshly admitted content, computed as a second pass now the size
   * is known. Content that was already stored keeps whatever parity it has; the
   * scrub is what brings an uncovered blob under protection.
   *
   * A failure here does not fail the admission. Storing the content is the
   * guarantee and parity is a protection over it, so the blob stands unprotected
   * and the scrub generates its parity later.
   */
  async #writeParityOnAdmission({ hash, size, existed }: PutResult): Promise<void> {
    if (existed || !this.#parity || !(await this.#parity.enabled())) {
      return;
    }
    try {
      // The tier the registry recorded, not the one admission asked for: a live
      // row keeps its own tier (spec: CACHE — content already held as cache stays
      // cache), so what parity covers follows the row rather than the intent.
      const registered = await this.#models.Blob.findOne({ where: { hash } });
      if (!registered || !(await this.#parity.covers({ size, tier: registered.tier }))) {
        return;
      }
      await this.#ensureFloor(await this.#parity.sidecarBytesFor(size));
      await this.#parity.write(hash, this.#pathFor(hash), size);
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
  /** Bytes already staged for a hash, so an interrupted transfer resumes from them. */
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
   * Append received content for a hash to its staging file. The caller states
   * the offset it is delivering from, which must equal the bytes already
   * staged — on mismatch nothing is written and the caller should re-check
   * stagedSize and resume from there. A failure partway through the source
   * keeps the bytes already appended as the resume point. Refuses rather than
   * take the volume below the free-disk reserve, like put.
   *
   * `maxBytes` bounds how many bytes this append may add. A source that would
   * exceed it is a protocol violation (a peer sending more than it declared):
   * the append stops before writing the overrun, the staging is discarded, and
   * it throws — so the store never writes unbounded excess ahead of the check.
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
          // Keep draining the source without writing more. Destroying it
          // mid-body instead would tear down the request socket, which the
          // response-logging middleware then dereferences on finish.
          continue;
        }
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (maxBytes !== undefined && written + buffer.length > maxBytes) {
          // A peer sending more than it declared is a protocol violation: stop
          // writing here (so the store never commits unbounded excess to disk)
          // and drain the rest before discarding the staging and refusing.
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
  /**
   * Verify the staged content against its hash and admit it into the store.
   * Verification covers the complete staged file, including any bytes
   * delivered before an interruption. On mismatch the staged content is
   * discarded and BlobHashMismatchError thrown. Idempotent: a hash the store
   * already holds commits as a no-op and drops the staging.
   */
  async commitStaged(hash: string): Promise<PutResult> {
    parseBlobHash(hash);
    return await this.#withStagingLock(hash, () => this.#commitStagedLocked(hash));
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
   * Refresh a blob's recency, coalesced: a no-op while the recorded access is
   * still within the window, so hot blobs don't rewrite the registry on every
   * read. Losing the most recent refreshes degrades eviction ordering only.
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
    // spec: FEC — parity dies with its blob. Before the row goes, since the
    // registry is what records that the sidecar exists.
    await this.discardParity(hash);
    // Hard delete: a soft-deleted row would shadow re-admission of the same
    // hash. Registry first, so a crash leaves an adoptable orphan file.
    await this.#models.Blob.destroy({ where: { hash }, force: true });
    try {
      await fs.rm(filePath, { force: true });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? '';
      // Windows refuses to unlink a file a reader still has open. The row is
      // already gone, so the file is an adoptable orphan — the same outcome
      // as a crash between the two steps — rather than a failed delete.
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(code)) {
        throw error;
      }
    }
  }

  #pathFor(hash: string): string {
    return path.join(this.root, ...blobPathSegments(hash));
  }

  // spec: XFER
  // Staging mutations for one hash are serialised within this process: the
  // offset check and the append must be atomic against concurrent transfers
  // of the same content, or interleaved appends corrupt the staging file. A
  // waiter that loses the race fails the offset check cleanly and resumes
  // from the new staged size. Writers in other processes are not covered;
  // commit verification remains the backstop there.
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
    // parseBlobHash constrains the hash to lowercase alphanumerics and a
    // colon, so the flat filename is path-safe on every filesystem.
    const { algorithm, digest } = parseBlobHash(hash);
    return path.join(this.root, STAGING_DIR, `${algorithm}-${digest}`);
  }

  async #writeTemp(source: Readable, tempPath: string): Promise<void> {
    let bytesSinceFloorCheck = 0;

    // Written through the handle, not a write stream from it: such a stream
    // holds a reference that handle.close() never resolves past.
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
   * `replace` is for content that must land even where the destination is
   * occupied — a repair over damaged bytes, or a regenerated sidecar. POSIX
   * renames over the destination atomically; Windows refuses, so the occupant is
   * removed and the rename retried.
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
            // A destination that cannot be removed yet (a reader still holds it
            // open on Windows) fails the next rename, so the retry cap below is
            // what bounds the wait.
            await fs.rm(finalPath, { force: true }).catch(() => {});
          } else {
            // A concurrent put of the same content won the rename; the stored
            // bytes are identical by content addressing, so ours is redundant.
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

    // Persist the rename itself. Windows cannot open a directory for fsync;
    // NTFS journals the rename, so skipping is safe there.
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
    // Race-safe against concurrent puts of the same content; the loser's
    // insert is a no-op against the winner's identical live row, which keeps
    // its tier: content already held as cache is durable on central and stays
    // cache even when re-admitted with outbox intent (spec: CACHE). A
    // soft-deleted row still occupies the unique index and would otherwise
    // shadow re-admission forever (invisible to has/get, conflicting here), so
    // resurrect it as the fresh admission it is: take the incoming tier (an
    // outbox re-admission must not stay evictable cache) and reset recency to
    // now (so it is not instantly the oldest LRU victim). Live rows are left
    // untouched.
    //
    // Admission hashes the content it stores, so the blob is verified as at
    // now: stamping the scrub time here keeps freshly admitted content from
    // going straight to the front of the scrub queue ahead of colder blobs.
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

// A single write may persist fewer bytes than given (e.g. the kernel keeps what
// fits as the volume fills and returns a short count), so loop until the whole
// buffer is down: a short write must never truncate content that a hash or a
// staged byte count has already accounted for.
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
// Hash the bytes as they pass and fail the stream at the end if they do not
// match, so a reader either gets content that verified or gets an error — never
// a clean end-of-stream over corrupt bytes. The mismatch surfaces after the
// bytes have gone out, which is unavoidable when verification is of the whole:
// what it protects is the reader's ability to tell a complete blob from a
// corrupt one.
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
      // Heal in the background: the reader's error must not wait on a repair,
      // and the repair must not be skipped because the reader gave up.
      void onMismatch();
      callback(
        new BlobHashMismatchError(`Stored content for ${hash} hashed to ${actualHash} on read`),
      );
    },
  });
  // The file handle must close whether the reader finished, errored, or walked
  // away, and a read error on the file must reach the reader rather than ending
  // the stream cleanly and failing verification instead.
  verifier.on('close', () => source.destroy());
  source.on('error', error => verifier.destroy(error));
  return source.pipe(verifier);
}

// Every file beneath a directory, depth-first, yielded as it goes. A missing
// directory is empty rather than an error: an algorithm's tree only exists once
// content has been stored under it.
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
