import { isEncodableGeometry, type ParityGeometry } from './parity';

// spec: FEC
// The suffix isn't lowercase hex, so the scrub's walk reads a sidecar as parity rather than a stray
// blob.
export const PARITY_SIDECAR_SUFFIX = '.parity';

const MAGIC = Uint8Array.from([0x54, 0x50, 0x41, 0x52]);
const FORMAT_VERSION = 1;

// spec: FEC
// A digest collision only costs a reconstruction the whole-blob hash check rejects.
export const SHARD_DIGEST_BYTES = 8;

export const PARITY_HEADER_BYTES = 32;

export interface ParitySidecarHeader {
  geometry: ParityGeometry;
  blobSize: number;
  digestBytes: number;
}

/** Also what admission reserves for a covered blob, hence exact rather than a proportion. */
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
 * The written geometry, not one recomputed from the current setting: a sidecar keeps decoding at
 * the proportion it was written at.
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
  const blobSize = Number(view.getBigUint64(16, true));
  if (!isEncodableGeometry(geometry, blobSize)) {
    throw new Error('Parity sidecar: header describes an impossible geometry');
  }
  return {
    geometry,
    blobSize,
    digestBytes: view.getUint8(5),
  };
}
