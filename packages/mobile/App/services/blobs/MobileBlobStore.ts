import RNFS from 'react-native-fs';
import { v4 as uuidv4 } from 'uuid';

import { BlobAdmission } from '@tamanu/blobs';
import { BLOB_INTEGRITY_STATES, BLOB_TIERS } from '@tamanu/constants';
import { InsufficientStorageError, NotFoundError } from '@tamanu/errors';
import { blobPathSegments, parseBlobHash } from '@tamanu/utils';

import { Blob } from '~/models/Blob';
import { DeviceStorageInfo } from './deviceStorage';

// spec: XFER
// Partially received transfers live here, named by their offered hash, so an
// interrupted transfer resumes from the bytes already delivered — including
// across an app restart.
const STAGING_DIR = 'staging';

// Bytes moved per read/append step when shuffling file content through memory
// (staging appends, push remainders). Content passes through as base64, so the
// in-memory string is ~4/3 of this.
export const FILE_COPY_CHUNK_BYTES = 2 * 1024 * 1024;

/** The subset of react-native-fs the store uses, injectable for tests. */
export interface BlobFileSystem {
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<{ size: number | string }>;
  hash(path: string, algorithm: string): Promise<string>;
  mkdir(path: string): Promise<void>;
  moveFile(from: string, to: string): Promise<void>;
  unlink(path: string): Promise<void>;
  read(path: string, length: number, position: number, encoding: string): Promise<string>;
  readFile(path: string, encoding: string): Promise<string>;
  writeFile(path: string, contents: string, encoding: string): Promise<void>;
  appendFile(path: string, contents: string, encoding: string): Promise<void>;
  getFSInfo(): Promise<DeviceStorageInfo>;
}

export interface MobileBlobStoreOptions {
  /** Store root directory, under the app's private storage. */
  root: string;
  models: { Blob: typeof Blob };
  getFreeDiskReserveBytes: (info: DeviceStorageInfo) => number;
  /**
   * Cache-eviction hook (spec: CAP): asked to free at least bytesNeeded before
   * the store refuses a new blob. Supplied by the cache tier.
   */
  evictCache?: (bytesNeeded: number) => Promise<unknown>;
  fs?: BlobFileSystem;
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
  tier: string;
}

// spec: CAS, CAP
// The device's content-addressed blob store: bytes on the app's private storage
// under an algorithm-namespaced two-level fan-out, and a row per blob in the
// local `blobs` registry. The device counterpart of the server BlobStore
// primitive, reshaped for a filesystem API that works on whole files rather
// than streams: content is admitted from a file already on disk and hashed in
// place, rather than hashed while streaming.
export class MobileBlobStore {
  readonly root: string;

  readonly #models: { Blob: typeof Blob };
  readonly #getFreeDiskReserveBytes: (info: DeviceStorageInfo) => number;
  readonly #fs: BlobFileSystem;

  readonly #admission: BlobAdmission;

  constructor({ root, models, getFreeDiskReserveBytes, evictCache, fs }: MobileBlobStoreOptions) {
    this.root = root;
    this.#models = models;
    this.#getFreeDiskReserveBytes = getFreeDiskReserveBytes;
    this.#fs = fs ?? (RNFS as unknown as BlobFileSystem);
    this.#admission = new BlobAdmission({
      hashFile: async (path, algorithm) => (await this.#fs.hash(path, algorithm)).toLowerCase(),
      fileExists: path => this.#fs.exists(path),
      fileSize: async path => Number((await this.#fs.stat(path)).size),
      place: async (fromPath, toPath) => {
        await this.#mkdirs(dirname(toPath));
        await this.#fs.moveFile(fromPath, toPath);
      },
      removeFile: async path => {
        if (await this.#fs.exists(path)) {
          await this.#fs.unlink(path);
        }
      },
      pathFor: hash => this.pathFor(hash),
      stagingPathFor: hash => this.#stagingPathFor(hash),
      stat: hash => this.stat(hash),
      register: (hash, size, tier) => this.#register(hash, size, tier),
      freeBytes: async () => (await this.#fs.getFSInfo()).freeSpace,
      reserveBytes: async () => this.#getFreeDiskReserveBytes(await this.#fs.getFSInfo()),
      ...(evictCache ? { evict: async (bytes: number) => void (await evictCache(bytes)) } : {}),
      // spec: SCRUB — a row left quarantined, or standing as absent after its
      // bytes went, is out of date once a replacement verifies. A row already
      // verified is left alone.
      markVerified: async (hash, size) => {
        await this.#models.Blob.getRepository().query(
          `
            UPDATE blobs
            SET integrityState = ?, size = ?, lastVerifiedAt = datetime('now')
            WHERE hash = ? AND integrityState != ?
          `,
          [BLOB_INTEGRITY_STATES.VERIFIED, size, hash, BLOB_INTEGRITY_STATES.VERIFIED],
        );
      },
      insufficientStorageError: ({ free, reserve, bytesNeeded }) =>
        new InsufficientStorageError(
          `Device storage is too full to store new content: ${free} bytes free, ${
            bytesNeeded ? `${bytesNeeded} needed, ` : ''
          }${reserve} reserved for the device's system and database`,
        ),
    });
  }

  pathFor(hash: string): string {
    return [this.root, ...blobPathSegments(hash)].join('/');
  }

  /**
   * Presence, not servability: a quarantined blob is present (has → true) but
   * is never served. A malformed hash throws rather than reporting absent.
   */
  async has(hash: string): Promise<boolean> {
    return Boolean(await this.stat(hash));
  }

  /** The registry's record of a held blob, or null when the blob is not held. */
  async stat(hash: string): Promise<BlobStat | null> {
    parseBlobHash(hash);
    const registered = await this.#models.Blob.findOne({ where: { hash } });
    if (!registered || !(await this.#fs.exists(this.pathFor(hash)))) {
      return null;
    }
    return {
      size: Number(registered.size),
      integrityState: registered.integrityState,
      tier: registered.tier,
    };
  }

  /**
   * The on-disk path of a held blob, for reading or uploading. Refuses a
   * quarantined blob: its bytes are retained for investigation, never served.
   * A caller that already holds the blob's stat passes it rather than paying
   * for a second lookup.
   */
  async servablePath(hash: string, known?: BlobStat | null): Promise<string> {
    const stat = known ?? (await this.stat(hash));
    if (!stat) {
      throw new NotFoundError(`Blob not found: ${hash}`);
    }
    if (stat.integrityState === BLOB_INTEGRITY_STATES.QUARANTINED) {
      throw new NotFoundError(`Blob is quarantined: ${hash}`);
    }
    return this.pathFor(hash);
  }

  // spec: SCRUB
  /**
   * Whether the stored bytes still hash to the blob's name. Reads the whole file,
   * so callers on the read path should consult verifiedWithin first.
   */
  async verify(hash: string): Promise<boolean> {
    const { algorithm, digest } = parseBlobHash(hash);
    const actual = await this.#fs.hash(this.pathFor(hash), algorithm);
    const matches = actual.toLowerCase() === digest;
    if (matches) {
      await this.#models.Blob.getRepository().query(
        `UPDATE blobs SET lastVerifiedAt = datetime('now') WHERE hash = ?`,
        [hash],
      );
    }
    return matches;
  }

  // spec: SCRUB
  /**
   * Whether the blob's content was confirmed to match its hash within the given
   * window. Compared in the database so the stored time needs no timezone
   * interpretation on the way out.
   */
  async verifiedWithin(hash: string, seconds: number): Promise<boolean> {
    const [row] = await this.#models.Blob.getRepository().query(
      `
        SELECT 1 AS ok FROM blobs
        WHERE hash = ?
          AND deletedAt IS NULL
          AND lastVerifiedAt IS NOT NULL
          AND lastVerifiedAt > datetime('now', ?)
      `,
      [hash, `-${seconds} seconds`],
    );
    return Boolean(row);
  }

  // spec: SCRUB
  /** Retain a corrupt blob's bytes for investigation but never serve or offer it. */
  async quarantine(hash: string): Promise<void> {
    await this.#models.Blob.getRepository().update(
      { hash },
      { integrityState: BLOB_INTEGRITY_STATES.QUARANTINED },
    );
  }

  // spec: CAS
  /**
   * Admit a file already on the device into the store: hash it in place, move
   * it into the fan-out path, and record it in the registry. The source file is
   * consumed — moved in, or removed when identical content is already stored —
   * so the device never keeps a second copy outside the store (spec: MOB).
   * Idempotent: identical content resolves to the one stored blob, keeping its
   * existing tier. Refuses (InsufficientStorageError) when the device's free
   * space is already below the reserve; the source file is left for the caller
   * to clean up with the rest of the failed operation.
   */
  async putFile(sourcePath: string, { tier }: { tier?: string } = {}): Promise<PutResult> {
    return await this.#admission.admitFile(sourcePath, { tier: tier ?? BLOB_TIERS.CACHE });
  }

  // spec: XFER
  /** Bytes already staged for a hash, so an interrupted transfer resumes from them. */
  async stagedSize(hash: string): Promise<number> {
    const stagingPath = this.#stagingPathFor(hash);
    if (!(await this.#fs.exists(stagingPath))) {
      return 0;
    }
    return Number((await this.#fs.stat(stagingPath)).size);
  }

  // spec: XFER
  /**
   * Append a downloaded part file's content to the hash's staging file,
   * consuming the part. Content moves through memory in bounded chunks, so a
   * large part never loads whole. Refuses rather than take the device below
   * the free-disk reserve.
   */
  async appendStagedFromFile(hash: string, partPath: string): Promise<number> {
    parseBlobHash(hash);
    const stagingPath = this.#stagingPathFor(hash);
    await this.#mkdirs(dirname(stagingPath));

    const partSize = Number((await this.#fs.stat(partPath)).size);
    await this.ensureFloor(partSize);

    for (let position = 0; position < partSize; position += FILE_COPY_CHUNK_BYTES) {
      const chunk = await this.#fs.read(partPath, FILE_COPY_CHUNK_BYTES, position, 'base64');
      await this.#fs.appendFile(stagingPath, chunk, 'base64');
    }
    await this.#fs.unlink(partPath);
    return await this.stagedSize(hash);
  }

  // spec: XFER
  /** Replace any staged bytes with a part file holding the complete content. */
  async replaceStagedWithFile(hash: string, partPath: string): Promise<number> {
    parseBlobHash(hash);
    const stagingPath = this.#stagingPathFor(hash);
    await this.#mkdirs(dirname(stagingPath));
    if (await this.#fs.exists(stagingPath)) {
      await this.#fs.unlink(stagingPath);
    }
    await this.#fs.moveFile(partPath, stagingPath);
    return await this.stagedSize(hash);
  }

  // spec: XFER
  /**
   * Verify the staged content against its hash and admit it into the store.
   * Verification covers the complete staged file, including any bytes
   * delivered before an interruption. On mismatch the staged content is
   * discarded and BlobHashMismatchError thrown, so the next attempt starts
   * clean. Idempotent: a hash the store already holds commits as a no-op and
   * drops the staging.
   */
  async commitStaged(hash: string): Promise<PutResult> {
    return await this.#admission.commitStaged(hash);
  }

  // spec: XFER
  async discardStaged(hash: string): Promise<void> {
    const stagingPath = this.#stagingPathFor(hash);
    if (await this.#fs.exists(stagingPath)) {
      await this.#fs.unlink(stagingPath);
    }
  }

  async delete(hash: string): Promise<void> {
    // Hard delete: a soft-deleted row would shadow re-admission of the same
    // hash. Registry first, so a crash leaves an adoptable orphan file.
    await this.#models.Blob.getRepository().delete({ hash });
    const filePath = this.pathFor(hash);
    if (await this.#fs.exists(filePath)) {
      await this.#fs.unlink(filePath);
    }
  }

  // spec: CAP
  /**
   * Keep the device's free space above the derived reserve, measured against
   * actual free space so growth in the database and unrelated apps' data is
   * accounted for. Evict cache first where a hook is available; refuse rather
   * than cross into the reserve.
   */
  async ensureFloor(bytesNeeded: number): Promise<void> {
    await this.#admission.ensureFloor(bytesNeeded);
  }

  #stagingPathFor(hash: string): string {
    // parseBlobHash constrains the hash to lowercase alphanumerics and a
    // colon, so the flat filename is path-safe.
    const { algorithm, digest } = parseBlobHash(hash);
    return [this.root, STAGING_DIR, `${algorithm}-${digest}`].join('/');
  }

  /** A part file's path for a transfer in progress; sits beside the staging file. */
  stagingPartPathFor(hash: string): string {
    return `${this.#stagingPathFor(hash)}.part`;
  }

  // spec: XFER
  /** Ready the staging area for a fresh part download, clearing any leftover part. */
  // spec: CACHE
  /**
   * Refresh a blob's recency, coalesced: a no-op while the recorded access is
   * still within the window, so hot blobs don't rewrite the registry on every
   * read. Losing the most recent refreshes degrades eviction ordering only.
   */
  async touch(hash: string, { coalesceSeconds }: { coalesceSeconds: number }): Promise<void> {
    await this.#models.Blob.getRepository().query(
      `
        UPDATE blobs
        SET lastAccessedAt = datetime('now')
        WHERE hash = ?
          AND deletedAt IS NULL
          AND lastAccessedAt < datetime('now', ?)
      `,
      [hash, `-${coalesceSeconds} seconds`],
    );
  }

  async prepareStagingPart(hash: string): Promise<string> {
    const partPath = this.stagingPartPathFor(hash);
    await this.#mkdirs(dirname(partPath));
    if (await this.#fs.exists(partPath)) {
      await this.#fs.unlink(partPath);
    }
    return partPath;
  }

  async #mkdirs(dir: string): Promise<void> {
    // react-native-fs mkdir creates intermediate directories and does not
    // error when the directory already exists.
    await this.#fs.mkdir(dir);
  }

  async #register(hash: string, size: number, tier?: string): Promise<void> {
    // Race-safe against concurrent puts of the same content: the loser's
    // insert is a no-op against the winner's identical live row, which keeps
    // its tier — content already held as cache is durable on central and stays
    // cache even when re-admitted with outbox intent (spec: CACHE). A
    // soft-deleted row still occupies the unique index and would otherwise
    // shadow re-admission forever, so resurrect it as the fresh admission it
    // is: take the incoming tier and reset recency to now.
    // spec: SCRUB — admission hashes the content, so it counts as a verification
    // and a first read of freshly admitted content need not re-hash it.
    await this.#models.Blob.getRepository().query(
      `
        INSERT INTO blobs (id, hash, size, integrityState, tier, lastAccessedAt, lastVerifiedAt)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT (hash) DO UPDATE
          SET deletedAt = NULL,
              updatedAt = datetime('now'),
              lastAccessedAt = datetime('now'),
              lastVerifiedAt = datetime('now'),
              tier = excluded.tier
          WHERE blobs.deletedAt IS NOT NULL
      `,
      [uuidv4(), hash, size, BLOB_INTEGRITY_STATES.VERIFIED, tier ?? BLOB_TIERS.CACHE],
    );
  }
}

function dirname(path: string): string {
  return path.slice(0, path.lastIndexOf('/'));
}
