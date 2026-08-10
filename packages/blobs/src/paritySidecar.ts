import { type ParityGeometry } from './parity';

// spec: FEC
// The on-disk layout of a blob's parity sidecar. Pure byte arithmetic: the
// package decides where everything sits, the host reads and writes it.
//
// A sidecar shares its blob's fan-out location with this suffix appended, so it
// is found, replaced and removed with the blob it protects. The suffix is not
// lowercase hex, so `blobHashFromPathSegments` rejects the path and the scrub's
// walk of the store reads it as parity rather than as a stray blob.
export const PARITY_SIDECAR_SUFFIX = '.parity';

const MAGIC = Uint8Array.from([0x54, 0x50, 0x41, 0x52]);
const FORMAT_VERSION = 1;

// spec: FEC
// Leading bytes of each shard's digest under the blob's own hash algorithm.
// Repair recomputes these to locate the damaged shards, which erasure decoding
// needs before it can reconstruct anything. Eight bytes is ample for that: a
// collision costs a reconstruction that the unconditional whole-blob hash check
// then rejects, never bytes accepted wrongly.
export const SHARD_DIGEST_BYTES = 8;

export const PARITY_HEADER_BYTES = 32;

export interface ParitySidecarHeader {
  geometry: ParityGeometry;
  /** The blob the sidecar protects, so a geometry mismatch is caught on read. */
  blobSize: number;
  digestBytes: number;
}

/**
 * Total sidecar size. Also what the free-disk floor reserves on top of a covered
 * blob at admission (spec: CAP), which is why it is exact rather than a
 * proportion: an operator raising the parity proportion raises this with it.
 */
export function paritySidecarByteCount(geometry: ParityGeometry): number {
  return (
    PARITY_HEADER_BYTES + digestTableByteCount(geometry) + parityDataByteCount(geometry)
  );
}

export function digestTableByteCount(geometry: ParityGeometry): number {
  const { groupCount, dataShards, parityShards } = geometry;
  return groupCount * (dataShards + parityShards) * SHARD_DIGEST_BYTES;
}

export function parityDataByteCount(geometry: ParityGeometry): number {
  return geometry.groupCount * geometry.parityShards * geometry.shardSize;
}

/**
 * Where a shard's digest sits. Slots a short final group does not fill are left
 * zero; which those are follows from the blob's size, so nothing reads them.
 */
export function shardDigestOffset(
  geometry: ParityGeometry,
  groupIndex: number,
  shardIndex: number,
): number {
  const { dataShards, parityShards } = geometry;
  const stride = (dataShards + parityShards) * SHARD_DIGEST_BYTES;
  return PARITY_HEADER_BYTES + groupIndex * stride + shardIndex * SHARD_DIGEST_BYTES;
}

export function parityShardOffset(
  geometry: ParityGeometry,
  groupIndex: number,
  parityIndex: number,
): number {
  const { parityShards, shardSize } = geometry;
  return (
    PARITY_HEADER_BYTES +
    digestTableByteCount(geometry) +
    (groupIndex * parityShards + parityIndex) * shardSize
  );
}

export function encodeParityHeader(geometry: ParityGeometry, blobSize: number): Uint8Array {
  const header = new Uint8Array(PARITY_HEADER_BYTES);
  const view = new DataView(header.buffer);
  header.set(MAGIC, 0);
  view.setUint8(4, FORMAT_VERSION);
  view.setUint8(5, SHARD_DIGEST_BYTES);
  view.setUint8(6, geometry.dataShards);
  view.setUint8(7, geometry.parityShards);
  view.setUint32(8, geometry.shardSize, true);
  view.setUint32(12, geometry.groupCount, true);
  view.setBigUint64(16, BigInt(blobSize), true);
  return header;
}

/**
 * The geometry the sidecar was written with, rather than one recomputed from the
 * current setting: the proportion applies to parity computed from the point it
 * changed, so an existing sidecar keeps decoding at the proportion it was written
 * at.
 */
export function decodeParityHeader(header: Uint8Array): ParitySidecarHeader {
  if (header.length < PARITY_HEADER_BYTES) {
    throw new Error(`Parity sidecar: header is ${header.length} bytes, expected ${PARITY_HEADER_BYTES}`);
  }
  if (!MAGIC.every((byte, index) => header[index] === byte)) {
    throw new Error('Parity sidecar: not a parity sidecar');
  }
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  const version = view.getUint8(4);
  if (version !== FORMAT_VERSION) {
    throw new Error(`Parity sidecar: unsupported format version ${version}`);
  }
  const geometry: ParityGeometry = {
    dataShards: view.getUint8(6),
    parityShards: view.getUint8(7),
    shardSize: view.getUint32(8, true),
    groupCount: view.getUint32(12, true),
  };
  if (geometry.dataShards === 0 || geometry.parityShards === 0 || geometry.shardSize === 0) {
    throw new Error('Parity sidecar: header describes an empty geometry');
  }
  return {
    geometry,
    blobSize: Number(view.getBigUint64(16, true)),
    digestBytes: view.getUint8(5),
  };
}
