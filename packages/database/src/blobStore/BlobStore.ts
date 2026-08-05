import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';

import { BLOB_INTEGRITY_STATES, CURRENT_BLOB_HASH_ALGORITHM } from '@tamanu/constants';
import { InsufficientStorageError, NotFoundError } from '@tamanu/errors';
import { blobPathSegments, formatBlobHash } from '@tamanu/utils/blobs';
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

  constructor({ root, models, getFreeDiskReserveBytes, evictCache, statfs }: BlobStoreOptions) {
    this.root = root;
    this.#models = models;
    this.#getFreeDiskReserveBytes = getFreeDiskReserveBytes;
    this.#evictCache = evictCache;
    this.#statfs = statfs ?? (r => fs.statfs(r));
  }

  async has(hash: string): Promise<boolean> {
    const filePath = this.#pathFor(hash);
    const registered = await this.#models.Blob.findOne({ where: { hash } });
    if (!registered) {
      return false;
    }
    return await fileExists(filePath);
  }

  async get(hash: string): Promise<Readable> {
    const filePath = this.#pathFor(hash);
    const registered = await this.#models.Blob.findOne({ where: { hash } });
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
    return handle.createReadStream();
  }

  /**
   * Admit content into the store: hash it while streaming to a temporary file
   * within the store, then atomically rename into the fan-out path and record
   * it in the registry. Idempotent — identical content resolves to the one
   * stored blob. Refuses (InsufficientStorageError) rather than take the
   * volume's free space below the configured reserve.
   */
  async put(source: Readable, { sizeHint }: { sizeHint?: number } = {}): Promise<PutResult> {
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

  async delete(hash: string): Promise<void> {
    const filePath = this.#pathFor(hash);
    // Hard delete: a soft-deleted row would shadow re-admission of the same
    // hash. Registry first, so a crash leaves an adoptable orphan file.
    await this.#models.Blob.destroy({ where: { hash }, force: true });
    await fs.rm(filePath, { force: true });
  }

  #pathFor(hash: string): string {
    return path.join(this.root, ...blobPathSegments(hash));
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
        await handle.write(buffer);
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
    // insert is a no-op against the winner's identical row.
    await this.#models.Blob.sequelize.query(
      `
        INSERT INTO blobs (id, hash, size)
        VALUES ($id, $hash, $size)
        ON CONFLICT (hash) DO NOTHING
      `,
      { bind: { id: randomUUID(), hash, size } },
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

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
