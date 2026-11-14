import RNFS from 'react-native-fs';
import { v4 as uuidv4 } from 'uuid';

import { BlobAdmission } from '@tamanu/blobs';
import { BLOB_INTEGRITY_STATES, BLOB_TIERS } from '@tamanu/constants';
import { InsufficientStorageError, NotFoundError } from '@tamanu/errors';
import { blobPathSegments, parseBlobHash } from '@tamanu/utils';

import { Blob } from '~/models/Blob';
import { DeviceStorageInfo } from './deviceStorage';

// spec: XFER
const STAGING_DIR = 'staging';

// Content passes through as base64, so the in-memory string is ~4/3 of this.
export const FILE_COPY_CHUNK_BYTES = 2 * 1024 * 1024;

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
  root: string;
  models: { Blob: typeof Blob };
  getFreeDiskReserveBytes: (info: DeviceStorageInfo) => number;
  // spec: CAP
  evictCache?: (bytesNeeded: number) => Promise<unknown>;
  fs?: BlobFileSystem;
}

export interface PutResult {
  hash: string;
  size: number;
  existed: boolean;
}

export interface BlobStat {
  size: number;
  integrityState: string;
  tier: string;
}

// spec: CAS, CAP
// The device counterpart of the server BlobStore: content is admitted from a file already on disk
// and hashed in place.
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
      storage: async () => {
        const info = await this.#fs.getFSInfo();
        return { free: info.freeSpace, reserve: this.#getFreeDiskReserveBytes(info) };
      },
      ...(evictCache ? { evict: async (bytes: number) => void (await evictCache(bytes)) } : {}),
      // spec: SCRUB
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
   * A corrupt blob is present but never served. A malformed hash throws rather than reporting
   * absent.
   */
  async has(hash: string): Promise<boolean> {
    return Boolean(await this.stat(hash));
  }

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

  // spec: AV
  /**
   * Refuses corrupt and quarantined content. The device runs no scanner, so central's quarantine
   * record is all it knows.
   */
  async servablePath(hash: string, known?: BlobStat | null): Promise<string> {
    const stat = known ?? (await this.stat(hash));
    if (!stat) {
      throw new NotFoundError(`Blob not found: ${hash}`);
    }
    if (stat.integrityState === BLOB_INTEGRITY_STATES.CORRUPT) {
      throw new NotFoundError(`Blob is corrupt: ${hash}`);
    }
    if (await this.isQuarantined(hash)) {
      throw new NotFoundError(`Blob is quarantined: ${hash}`);
    }
    return this.pathFor(hash);
  }

  // spec: AV
  async isQuarantined(hash: string): Promise<boolean> {
    return Boolean(await this.#models.BlobQuarantine.findOne({ where: { hash } }));
  }

  // spec: SCRUB
  /** Reads the whole file, so read-path callers should check verifiedWithin first. */
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
  /** Compared in the database so the stored time needs no timezone interpretation. */
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
  async markCorrupt(hash: string): Promise<void> {
    await this.#models.Blob.getRepository().update(
      { hash },
      { integrityState: BLOB_INTEGRITY_STATES.CORRUPT },
    );
  }

  // spec: CAS
  // spec: MOB
  /**
   * Consumes the source file, so the device never keeps a second copy outside the store. On
   * InsufficientStorageError the source is left for the caller to clean up.
   */
  async putFile(sourcePath: string, { tier }: { tier?: string } = {}): Promise<PutResult> {
    return await this.#admission.admitFile(sourcePath, { tier: tier ?? BLOB_TIERS.CACHE });
  }

  // spec: XFER
  async stagedSize(hash: string): Promise<number> {
    const stagingPath = this.#stagingPathFor(hash);
    if (!(await this.#fs.exists(stagingPath))) {
      return 0;
    }
    return Number((await this.#fs.stat(stagingPath)).size);
  }

  // spec: XFER
  /** Content moves through memory in bounded chunks, so a large part never loads whole. */
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
  /** On mismatch the staging is discarded and BlobHashMismatchError thrown. */
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
    // Hard delete: a soft-deleted row would shadow re-admission. Registry first, so a crash leaves
    // an adoptable orphan.
    await this.#models.Blob.getRepository().delete({ hash });
    const filePath = this.pathFor(hash);
    if (await this.#fs.exists(filePath)) {
      await this.#fs.unlink(filePath);
    }
  }

  // spec: CAP
  /** Measured against actual free space, so database growth and other apps' data count. */
  async ensureFloor(bytesNeeded: number): Promise<void> {
    await this.#admission.ensureFloor(bytesNeeded);
  }

  #stagingPathFor(hash: string): string {
    const { algorithm, digest } = parseBlobHash(hash);
    return [this.root, STAGING_DIR, `${algorithm}-${digest}`].join('/');
  }

  stagingPartPathFor(hash: string): string {
    return `${this.#stagingPathFor(hash)}.part`;
  }

  // spec: CACHE
  /**
   * No-op while the last access is within the window, so hot blobs don't rewrite the registry on
   * every read.
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
    await this.#fs.mkdir(dir);
  }

  async #register(hash: string, size: number, tier?: string): Promise<void> {
    // A live row keeps its tier: content held as cache is durable on central and stays cache even
    // under outbox intent. A soft-deleted row still holds the unique index, so it's resurrected
    // with the incoming tier and fresh recency.
    // spec: SCRUB
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
