import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';

import { BLOB_INTEGRITY_STATES, CURRENT_BLOB_HASH_ALGORITHM } from '@tamanu/constants';
import {
  BlobHashMismatchError,
  InsufficientStorageError,
  InvalidParameterError,
  NotFoundError,
} from '@tamanu/errors';
import { blobPathSegments, formatBlobHash, parseBlobHash } from '@tamanu/utils/blobs';
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
  readonly #evictCache?: (bytesNeeded: number) => Promise<void>;
  readonly #statfs: (root: string) => Promise<VolumeStats>;
  readonly #stagingLocks = new Map<string, Promise<unknown>>();

  constructor({ root, models, getFreeDiskReserveBytes, evictCache, statfs }: BlobStoreOptions) {
    this.root = root;
    this.#models = models;
    this.#getFreeDiskReserveBytes = getFreeDiskReserveBytes;
    this.#evictCache = evictCache;
    this.#statfs = statfs ?? (r => fs.statfs(r));
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

  async get(
    hash: string,
    { start, end, stat }: { start?: number; end?: number; stat?: BlobStat | null } = {},
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
    return handle.createReadStream({ start, end });
  }

  /** The registry's record of a held blob, or null when the blob is not held. */
  async stat(hash: string): Promise<BlobStat | null> {
    const registered = await this.#models.Blob.findOne({ where: { hash } });
    if (!registered || !(await fileExists(this.#pathFor(hash)))) {
      return null;
    }
    return { size: registered.size, integrityState: registered.integrityState };
  }

  /**
   * Admit content into the store: hash it while streaming to a temporary file
   * within the store, then atomically rename into the fan-out path and record
   * it in the registry. Idempotent — identical content resolves to the one
   * stored blob. Refuses (InsufficientStorageError) rather than take the
   * volume's free space below the configured reserve. On any failure the
   * source stream is destroyed; it cannot be reused.
   *
   * Cannot replace bytes already stored under the hash: an existing blob wins
   * (`existed: true`), including a quarantined one, whose corrupt bytes and
   * state are kept. Repair is delete-then-put.
   */
  async put(source: Readable, options: { sizeHint?: number } = {}): Promise<PutResult> {
    try {
      return await this.#admit(source, options);
    } catch (error) {
      source.destroy();
      throw error;
    }
  }

  async #admit(source: Readable, { sizeHint }: { sizeHint?: number }): Promise<PutResult> {
    const tempDir = path.join(this.root, TEMP_DIR);
    await fs.mkdir(tempDir, { recursive: true });
    await this.#ensureFloor(sizeHint ?? 0);

    const tempPath = path.join(tempDir, randomUUID());
    let size: number;
    let digest: string;
    try {
      ({ size, digest } = await this.#writeAndHash(source, tempPath));
      await this.#ensureFloor(0);
    } catch (error) {
      await fs.rm(tempPath, { force: true });
      throw error;
    }

    const hash = formatBlobHash(CURRENT_BLOB_HASH_ALGORITHM, digest);
    const finalPath = this.#pathFor(hash);
    const existed = await fileExists(finalPath);
    if (existed) {
      await fs.rm(tempPath, { force: true });
    } else {
      await this.#placeAtFinalPath(tempPath, finalPath);
    }

    // Register after placement: a crash in between leaves an orphan file that
    // the next put of the same content adopts, never a registry row pointing
    // at missing bytes.
    await this.#register(hash, size);

    return { hash, size, existed };
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
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (maxBytes !== undefined && written + buffer.length > maxBytes) {
          // Stop before writing the overrun; break so the finally closes the
          // handle before the staging is removed (Windows cannot unlink an
          // open file). Breaking also destroys the source stream.
          overran = true;
          break;
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
    const existing = await this.stat(hash);
    if (existing) {
      await this.#removeStagingFile(hash);
      return { hash, size: existing.size, existed: true };
    }

    const { algorithm } = parseBlobHash(hash);
    const stagingPath = this.#stagingPathFor(hash);
    let handle;
    try {
      handle = await fs.open(stagingPath, 'r');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError(`Nothing staged for blob: ${hash}`);
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
    if (actualHash !== hash) {
      await this.#removeStagingFile(hash);
      throw new BlobHashMismatchError(
        `Staged content for ${hash} hashed to ${actualHash}; content discarded`,
      );
    }

    await this.#placeAtFinalPath(stagingPath, this.#pathFor(hash));
    await this.#register(hash, size);
    return { hash, size, existed: false };
  }

  // spec: XFER
  async discardStaged(hash: string): Promise<void> {
    await this.#withStagingLock(hash, () => this.#removeStagingFile(hash));
  }

  async #removeStagingFile(hash: string): Promise<void> {
    await fs.rm(this.#stagingPathFor(hash), { force: true });
  }

  async delete(hash: string): Promise<void> {
    const filePath = this.#pathFor(hash);
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

  async #writeAndHash(
    source: Readable,
    tempPath: string,
  ): Promise<{ size: number; digest: string }> {
    const hasher = createHash(CURRENT_BLOB_HASH_ALGORITHM);
    let size = 0;
    let bytesSinceFloorCheck = 0;

    // Written through the handle, not a write stream from it: such a stream
    // holds a reference that handle.close() never resolves past.
    const handle = await fs.open(tempPath, 'wx');
    try {
      for await (const chunk of source) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        hasher.update(buffer);
        size += buffer.length;
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

    return { size, digest: hasher.digest('hex') };
  }

  async #placeAtFinalPath(tempPath: string, finalPath: string): Promise<void> {
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
          // A concurrent put of the same content won the rename; the stored
          // bytes are identical by content addressing, so ours is redundant.
          await fs.rm(tempPath, { force: true });
          return;
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

  async #register(hash: string, size: number): Promise<void> {
    // Race-safe against concurrent puts of the same content; the loser's
    // insert is a no-op against the winner's identical row. A soft-deleted
    // row still occupies the unique index and would otherwise shadow
    // re-admission forever (invisible to has/get, conflicting here), so
    // resurrect it; rows that are alive are left untouched.
    await this.#models.Blob.sequelize.query(
      `
        INSERT INTO blobs (id, hash, size, integrity_state)
        VALUES ($id, $hash, $size, $integrityState)
        ON CONFLICT (hash) DO UPDATE
          SET deleted_at = NULL, updated_at = now()
          WHERE blobs.deleted_at IS NOT NULL
      `,
      {
        bind: {
          id: randomUUID(),
          hash,
          size,
          integrityState: BLOB_INTEGRITY_STATES.VERIFIED,
        },
      },
    );
  }

  // spec: CAP
  // Keep the volume's free space above the configured reserve, measured
  // against actual free space so growth in the database or other consumers is
  // accounted for. Evict cache first where a hook is available; refuse rather
  // than cross into the reserve.
  async #ensureFloor(bytesNeeded: number): Promise<void> {
    const reserve = await this.#getFreeDiskReserveBytes();
    let free = await this.#volumeFreeBytes();
    if (free - bytesNeeded >= reserve) {
      return;
    }
    if (this.#evictCache) {
      await this.#evictCache(reserve + bytesNeeded - free);
      free = await this.#volumeFreeBytes();
      if (free - bytesNeeded >= reserve) {
        return;
      }
    }
    throw new InsufficientStorageError(
      `Blob store refused new content: ${free} bytes free on volume, ${
        bytesNeeded ? `${bytesNeeded} needed, ` : ''
      }${reserve} reserved for the system`,
    );
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

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
