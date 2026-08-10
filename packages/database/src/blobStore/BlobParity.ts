import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';

import {
  PARITY_HEADER_BYTES,
  PARITY_SIDECAR_SUFFIX,
  ParityBudgetExceededError,
  ParityDecoder,
  ParityEncoder,
  SHARD_DIGEST_BYTES,
  decodeParityHeader,
  digestTableByteCount,
  encodeParityHeader,
  groupDataShardCount,
  groupStart,
  isParityCovered,
  parityGeometry,
  parityShardOffset,
  paritySidecarByteCount,
  shardDigestOffset,
  type ParityGeometry,
} from '@tamanu/blobs';
import { type BlobTier } from '@tamanu/constants';
import { parseBlobHash } from '@tamanu/utils/blobs';

// Bytes of each shard held resident while recovering a group, so a repair's
// memory is bounded by the geometry rather than by the blob's size.
const RECOVERY_SLICE_BYTES = 64 * 1024;

/** Bytes a shard really covers: a blob's final data shard may be short. */
function shardLength(
  geometry: ParityGeometry,
  blobSize: number,
  group: number,
  index: number,
): number {
  if (index >= geometry.dataShards) {
    return geometry.shardSize;
  }
  const at = groupStart(geometry, group) + index * geometry.shardSize;
  return Math.max(0, Math.min(geometry.shardSize, blobSize - at));
}

export interface ErrorCorrectionSettings {
  enabled: boolean;
  /** Parity as a proportion of the blob, e.g. 0.1 for the 10% default. */
  proportion: number;
}

export interface BlobParityOptions {
  getSettings: () => Promise<ErrorCorrectionSettings>;
  /** spec: FEC — the tiers this server's coverage includes. */
  coveredTiers: readonly BlobTier[];
  pathFor: (hash: string) => string;
  createTempPath: () => Promise<string>;
  place: (fromPath: string, toPath: string) => Promise<void>;
  onWarning?: (message: string, details: Record<string, unknown>) => void;
}

// spec: FEC
// The parity sidecar's io: which blobs are covered, writing a sidecar from a
// blob's bytes, and reconstructing a damaged blob from one. The codec and the
// sidecar's layout are sans-io in @tamanu/blobs; everything here is file access
// around them.
//
// Parity is derived data. A sidecar that cannot be written, is missing, or is
// itself damaged is never a fault of its own: the blob is stored or served
// unprotected and the scrub regenerates the sidecar.
export class BlobParity {
  readonly #getSettings: () => Promise<ErrorCorrectionSettings>;
  readonly #coveredTiers: readonly BlobTier[];
  readonly #pathFor: (hash: string) => string;
  readonly #createTempPath: () => Promise<string>;
  readonly #place: (fromPath: string, toPath: string) => Promise<void>;
  readonly #onWarning?: (message: string, details: Record<string, unknown>) => void;

  constructor({
    getSettings,
    coveredTiers,
    pathFor,
    createTempPath,
    place,
    onWarning,
  }: BlobParityOptions) {
    this.#getSettings = getSettings;
    this.#coveredTiers = coveredTiers;
    this.#pathFor = pathFor;
    this.#createTempPath = createTempPath;
    this.#place = place;
    this.#onWarning = onWarning;
  }

  // spec: FEC
  /** Whether error correction is on for this server at all. */
  async enabled(): Promise<boolean> {
    return (await this.#getSettings()).enabled;
  }

  // spec: FEC
  /** Whether this server computes parity for a blob, by its tier and its size. */
  async covers({ size, tier }: { size: number; tier: BlobTier }): Promise<boolean> {
    const { enabled } = await this.#getSettings();
    return enabled && isParityCovered({ size, tier }, { coveredTiers: this.#coveredTiers });
  }

  // spec: CAP
  /**
   * Disk a covered blob's sidecar will occupy, for the free-disk floor to account
   * for alongside the blob itself. Exact rather than a fixed proportion, so
   * raising the parity setting raises what admission reserves.
   */
  async sidecarBytesFor(size: number): Promise<number> {
    const { proportion } = await this.#getSettings();
    return paritySidecarByteCount(parityGeometry(size, proportion));
  }

  sidecarPathFor(hash: string): string {
    return `${this.#pathFor(hash)}${PARITY_SIDECAR_SUFFIX}`;
  }

  async has(hash: string): Promise<boolean> {
    try {
      await fs.access(this.sidecarPathFor(hash));
      return true;
    } catch {
      return false;
    }
  }

  // spec: FEC
  /** Parity dies with its blob: on delete, and on demotion out of the outbox. */
  async remove(hash: string): Promise<void> {
    await fs.rm(this.sidecarPathFor(hash), { force: true });
  }

  // spec: FEC
  /**
   * Compute parity for a blob from a file holding its bytes, and place the
   * sidecar beside it. A second pass over the file rather than part of the write,
   * because the shard geometry needs the blob's size, which streaming admission
   * only knows once the bytes are down.
   *
   * The sidecar is built at a temporary path and moved into place, so a partial
   * one is never read as a whole one.
   */
  async write(hash: string, sourcePath: string, size: number): Promise<void> {
    const { algorithm } = parseBlobHash(hash);
    const { proportion } = await this.#getSettings();
    const geometry = parityGeometry(size, proportion);

    const sidecarPath = await this.#createTempPath();
    const source = await fs.open(sourcePath, 'r');
    try {
      const sidecar = await fs.open(sidecarPath, 'w');
      try {
        await sidecar.write(encodeParityHeader(geometry, size), 0, PARITY_HEADER_BYTES, 0);
        const digests = new Uint8Array(digestTableByteCount(geometry));
        const encoder = new ParityEncoder(geometry);
        const shard = Buffer.alloc(geometry.shardSize);

        for (let group = 0; group < geometry.groupCount; group++) {
          encoder.beginGroup();
          const dataShards = groupDataShardCount(geometry, group, size);
          for (let index = 0; index < dataShards; index++) {
            const at = groupStart(geometry, group) + index * geometry.shardSize;
            const length = Math.min(geometry.shardSize, size - at);
            const { bytesRead } = await source.read(shard, 0, length, at);
            const bytes = shard.subarray(0, bytesRead);
            encoder.addDataShard(index, bytes);
            this.#recordDigest(digests, geometry, group, index, bytes, algorithm);
          }

          const parity = encoder.groupParity();
          for (let index = 0; index < parity.length; index++) {
            const bytes = parity[index];
            await sidecar.write(bytes, 0, bytes.length, parityShardOffset(geometry, group, index));
            this.#recordDigest(
              digests,
              geometry,
              group,
              geometry.dataShards + index,
              bytes,
              algorithm,
            );
          }
        }

        // Written last: the table's slot for a shard is only known once that
        // shard has been read or computed, and it sits ahead of the parity so a
        // repair reads it in one go.
        await sidecar.write(digests, 0, digests.length, PARITY_HEADER_BYTES);
        await sidecar.sync();
      } finally {
        await sidecar.close();
      }
    } catch (error) {
      await fs.rm(sidecarPath, { force: true });
      throw error;
    } finally {
      await source.close();
    }

    await this.#place(sidecarPath, this.sidecarPathFor(hash));
  }

  // spec: FEC
  /**
   * Reconstruct a damaged blob from its parity into `destinationPath`, returning
   * whether it could. False covers every way parity cannot help — no sidecar, a
   * damaged sidecar, or corruption beyond the parity budget — because the
   * response is the same in each case: fall through to the rest of the self-heal
   * ladder.
   *
   * The reconstruction is NOT verified here. Locating the damaged region is part
   * of the repair, and a region located wrongly decodes "successfully" into
   * different bytes, so the caller must check the result against the blob's hash
   * unconditionally.
   */
  async reconstruct(hash: string, destinationPath: string): Promise<boolean> {
    const { algorithm } = parseBlobHash(hash);
    let sidecar;
    try {
      sidecar = await fs.open(this.sidecarPathFor(hash), 'r');
    } catch {
      return false;
    }

    try {
      const header = await this.#readParityHeader(sidecar);
      if (!header) {
        return false;
      }
      const { geometry, blobSize } = header;
      const digests = Buffer.alloc(digestTableByteCount(geometry));
      await sidecar.read(digests, 0, digests.length, PARITY_HEADER_BYTES);

      const blob = await fs.open(this.#pathFor(hash), 'r');
      const destination = await fs.open(destinationPath, 'w');
      try {
        for (let group = 0; group < geometry.groupCount; group++) {
          const recovered = await this.#recoverGroup({
            geometry,
            blobSize,
            group,
            algorithm,
            digests,
            blob,
            sidecar,
          });
          if (!recovered) {
            return false;
          }
          await this.#writeGroup({ geometry, blobSize, group, blob, destination, recovered });
        }
        await destination.sync();
      } finally {
        await destination.close();
        await blob.close();
      }
    } catch (error) {
      this.#onWarning?.('reconstruction from parity failed', {
        hash,
        error: (error as Error).message,
      });
      return false;
    } finally {
      await sidecar.close();
    }
    return true;
  }

  async #readParityHeader(sidecar: fs.FileHandle) {
    const header = Buffer.alloc(PARITY_HEADER_BYTES);
    const { bytesRead } = await sidecar.read(header, 0, PARITY_HEADER_BYTES, 0);
    if (bytesRead < PARITY_HEADER_BYTES) {
      return null;
    }
    return decodeParityHeader(header.subarray(0, bytesRead));
  }

  /**
   * The group's data shards as they should be: recomputed digests locate the
   * damage, and the erased shards are decoded from those that survived. Null when
   * the damage is beyond what the parity covers.
   */
  async #recoverGroup({
    geometry,
    blobSize,
    group,
    algorithm,
    digests,
    blob,
    sidecar,
  }: {
    geometry: ParityGeometry;
    blobSize: number;
    group: number;
    algorithm: string;
    digests: Buffer;
    blob: fs.FileHandle;
    sidecar: fs.FileHandle;
  }): Promise<Map<number, Uint8Array> | null> {
    const dataShards = groupDataShardCount(geometry, group, blobSize);
    const present: number[] = [];
    const erased: number[] = [];

    const readShard = (index: number, offset: number, length: number) =>
      this.#readShardSlice({ geometry, blobSize, group, index, offset, length, blob, sidecar });

    for (let index = 0; index < geometry.dataShards + geometry.parityShards; index++) {
      if (index >= dataShards && index < geometry.dataShards) {
        // A slot past the blob's end holds no bytes: it is zeros, and zeros are
        // what the encode used, so it counts as a shard that survived.
        present.push(index);
        continue;
      }
      const bytes = await readShard(index, 0, geometry.shardSize);
      // Digested over the shard's real length, which is what the encode hashed: a
      // short final shard padded out to a whole one would never match.
      const real = bytes.subarray(0, shardLength(geometry, blobSize, group, index));
      if (this.#digestMatches(digests, geometry, group, index, real, algorithm)) {
        present.push(index);
      } else if (index < geometry.dataShards) {
        erased.push(index);
      }
    }

    if (erased.length === 0) {
      return new Map();
    }

    let decoder;
    try {
      decoder = new ParityDecoder(geometry, { present, erased });
    } catch (error) {
      if (error instanceof ParityBudgetExceededError) {
        return null;
      }
      throw error;
    }

    const recovered = new Map(erased.map(index => [index, new Uint8Array(geometry.shardSize)]));
    for (let offset = 0; offset < geometry.shardSize; offset += RECOVERY_SLICE_BYTES) {
      const length = Math.min(RECOVERY_SLICE_BYTES, geometry.shardSize - offset);
      const slices = [];
      for (const index of decoder.requiredShards) {
        slices.push(await readShard(index, offset, length));
      }
      decoder.recoverSlice(slices).forEach((slice, row) => {
        recovered.get(erased[row])!.set(slice, offset);
      });
    }
    return recovered;
  }

  /**
   * A slice of one shard, zero-filled past the blob's end so a truncated blob
   * reads the way the encode saw it rather than short.
   */
  async #readShardSlice({
    geometry,
    blobSize,
    group,
    index,
    offset,
    length,
    blob,
    sidecar,
  }: {
    geometry: ParityGeometry;
    blobSize: number;
    group: number;
    index: number;
    offset: number;
    length: number;
    blob: fs.FileHandle;
    sidecar: fs.FileHandle;
  }): Promise<Uint8Array> {
    const slice = Buffer.alloc(length);
    if (index < geometry.dataShards) {
      const at = groupStart(geometry, group) + index * geometry.shardSize + offset;
      const readable = Math.max(0, Math.min(length, blobSize - at));
      if (readable > 0) {
        await blob.read(slice, 0, readable, at);
      }
      return slice;
    }
    const at = parityShardOffset(geometry, group, index - geometry.dataShards) + offset;
    await sidecar.read(slice, 0, length, at);
    return slice;
  }

  /** The blob's bytes for a group: what survived, plus what was reconstructed. */
  async #writeGroup({
    geometry,
    blobSize,
    group,
    blob,
    destination,
    recovered,
  }: {
    geometry: ParityGeometry;
    blobSize: number;
    group: number;
    blob: fs.FileHandle;
    destination: fs.FileHandle;
    recovered: Map<number, Uint8Array>;
  }): Promise<void> {
    const dataShards = groupDataShardCount(geometry, group, blobSize);
    const shard = Buffer.alloc(geometry.shardSize);
    for (let index = 0; index < dataShards; index++) {
      const at = groupStart(geometry, group) + index * geometry.shardSize;
      const length = Math.min(geometry.shardSize, blobSize - at);
      const reconstruction = recovered.get(index);
      if (reconstruction) {
        await destination.write(reconstruction, 0, length, at);
        continue;
      }
      const { bytesRead } = await blob.read(shard, 0, length, at);
      await destination.write(shard, 0, bytesRead, at);
    }
  }

  #shardDigest(bytes: Uint8Array, algorithm: string): Buffer {
    return createHash(algorithm).update(bytes).digest().subarray(0, SHARD_DIGEST_BYTES);
  }

  #recordDigest(
    digests: Uint8Array,
    geometry: ParityGeometry,
    group: number,
    index: number,
    bytes: Uint8Array,
    algorithm: string,
  ): void {
    digests.set(
      this.#shardDigest(bytes, algorithm),
      shardDigestOffset(geometry, group, index) - PARITY_HEADER_BYTES,
    );
  }

  #digestMatches(
    digests: Buffer,
    geometry: ParityGeometry,
    group: number,
    index: number,
    bytes: Uint8Array,
    algorithm: string,
  ): boolean {
    const at = shardDigestOffset(geometry, group, index) - PARITY_HEADER_BYTES;
    return this.#shardDigest(bytes, algorithm).equals(digests.subarray(at, at + SHARD_DIGEST_BYTES));
  }
}
