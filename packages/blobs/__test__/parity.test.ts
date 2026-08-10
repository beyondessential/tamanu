import { describe, expect, it } from 'vitest';

import { BLOB_TIERS } from '@tamanu/constants';
import { blobHashFromPathSegments, blobPathSegments } from '@tamanu/utils/blobs';

import {
  CENTRAL_PARITY_TIERS,
  FACILITY_PARITY_TIERS,
  MINIMUM_COVERED_BLOB_SIZE,
  ParityBudgetExceededError,
  ParityDecoder,
  ParityEncoder,
  groupDataShardCount,
  groupStart,
  isParityCovered,
  parityGeometry,
  type ParityGeometry,
} from '../src/parity';
import {
  PARITY_HEADER_BYTES,
  PARITY_SIDECAR_SUFFIX,
  decodeParityHeader,
  encodeParityHeader,
  parityShardOffset,
  paritySidecarByteCount,
  shardDigestOffset,
} from '../src/paritySidecar';

const KIB = 1024;
const MIB = 1024 * 1024;
const DEFAULT_PROPORTION = 0.1;

// Deterministic pseudo-random content, so a seeded-corruption case fails the
// same way every run.
function content(bytes: number, seed = 1): Uint8Array {
  const blob = new Uint8Array(bytes);
  let state = seed;
  for (let offset = 0; offset < bytes; offset++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    blob[offset] = (state >>> 16) & 0xff;
  }
  return blob;
}

// Byte arrays here run to hundreds of kilobytes, which a structural matcher
// cannot diff without exhausting the heap.
function expectSameBytes(actual: Uint8Array, expected: Uint8Array): void {
  expect(actual.length).toBe(expected.length);
  expect(actual.findIndex((byte, index) => byte !== expected[index])).toBe(-1);
}

function expectDifferentBytes(actual: Uint8Array, expected: Uint8Array): void {
  expect(actual.length).toBe(expected.length);
  expect(actual.some((byte, index) => byte !== expected[index])).toBe(true);
}

function dataShardBytes(
  blob: Uint8Array,
  geometry: ParityGeometry,
  group: number,
  shard: number,
): Uint8Array {
  const start = groupStart(geometry, group) + shard * geometry.shardSize;
  return blob.subarray(start, Math.min(blob.length, start + geometry.shardSize));
}

/** A group's data shard slots, padded out: a slot past the blob's end is zeros. */
function paddedDataShards(
  blob: Uint8Array,
  geometry: ParityGeometry,
  group: number,
): Uint8Array[] {
  return Array.from({ length: geometry.dataShards }, (_unused, shard) => {
    const padded = new Uint8Array(geometry.shardSize);
    padded.set(dataShardBytes(blob, geometry, group, shard));
    return padded;
  });
}

function encodeGroupParity(
  blob: Uint8Array,
  geometry: ParityGeometry,
  group: number,
): Uint8Array[] {
  const encoder = new ParityEncoder(geometry);
  encoder.beginGroup();
  for (let shard = 0; shard < groupDataShardCount(geometry, group, blob.length); shard++) {
    encoder.addDataShard(shard, dataShardBytes(blob, geometry, group, shard));
  }
  return encoder.groupParity().map(shard => Uint8Array.from(shard));
}

/**
 * What the store's repair path does, in memory. `corrupt` names shards whose
 * bytes are overwritten as a bad cluster would overwrite them; `erase` names the
 * shards the caller tells the decoder about, which is a separate thing — locating
 * damage is the caller's job and it can get it wrong. Indices run across the
 * group, data shards first then parity.
 */
function recoverGroup(
  blob: Uint8Array,
  geometry: ParityGeometry,
  group: number,
  { corrupt = [], erase = corrupt }: { corrupt?: readonly number[]; erase?: readonly number[] },
): Uint8Array[] {
  const shards = [
    ...paddedDataShards(blob, geometry, group),
    ...encodeGroupParity(blob, geometry, group),
  ];
  for (const index of corrupt) {
    shards[index] = content(geometry.shardSize, 9000 + index);
  }

  const present = shards.map((_bytes, index) => index).filter(index => !erase.includes(index));
  const erased = erase.filter(index => index < geometry.dataShards);

  const decoder = new ParityDecoder(geometry, { present, erased });
  const recovered = decoder.recoverSlice(decoder.requiredShards.map(index => shards[index]));

  const dataShards = shards.slice(0, geometry.dataShards);
  erased.forEach((shard, row) => {
    dataShards[shard] = recovered[row];
  });
  return dataShards;
}

function joinShards(shards: readonly Uint8Array[], length: number): Uint8Array {
  const blob = new Uint8Array(length);
  shards.forEach((shard, index) => {
    const start = index * shards[0].length;
    if (start < length) {
      blob.set(shard.subarray(0, Math.min(shard.length, length - start)), start);
    }
  });
  return blob;
}

describe('shard geometry', () => {
  // spec: FEC
  it('sizes shards so one bad cluster damages exactly one shard', () => {
    expect(parityGeometry(32 * KIB, DEFAULT_PROPORTION)).toEqual({
      shardSize: 4 * KIB,
      dataShards: 8,
      parityShards: 1,
      groupCount: 1,
    });
    expect(parityGeometry(64 * KIB, DEFAULT_PROPORTION)).toEqual({
      shardSize: 4 * KIB,
      dataShards: 16,
      parityShards: 2,
      groupCount: 1,
    });
    expect(parityGeometry(256 * KIB, DEFAULT_PROPORTION)).toEqual({
      shardSize: 8 * KIB,
      dataShards: 32,
      parityShards: 3,
      groupCount: 1,
    });
  });

  // spec: FEC
  it('reaches 32+3 at the default proportion from 1 MiB up', () => {
    expect(parityGeometry(MIB, DEFAULT_PROPORTION)).toMatchObject({
      dataShards: 32,
      parityShards: 3,
      groupCount: 1,
    });
    expect(parityGeometry(32 * MIB, DEFAULT_PROPORTION)).toMatchObject({
      shardSize: MIB,
      dataShards: 32,
      parityShards: 3,
      groupCount: 1,
    });
  });

  // spec: FEC
  it('splits a large blob into groups rather than growing its shards', () => {
    const geometry = parityGeometry(320 * MIB, DEFAULT_PROPORTION);
    expect(geometry.shardSize).toBe(MIB);
    expect(geometry.dataShards).toBeLessThanOrEqual(32);
    expect(geometry.groupCount * geometry.dataShards * geometry.shardSize).toBeGreaterThanOrEqual(
      320 * MIB,
    );
  });

  // spec: FEC
  it('spreads data shards evenly so the last group is not a runt', () => {
    const geometry = parityGeometry(33 * MIB, DEFAULT_PROPORTION);
    expect(geometry).toEqual({
      shardSize: MIB,
      dataShards: 17,
      parityShards: 2,
      groupCount: 2,
    });
    expect(groupDataShardCount(geometry, 0, 33 * MIB)).toBe(17);
    expect(groupDataShardCount(geometry, 1, 33 * MIB)).toBe(16);
  });

  // spec: FEC
  it('keeps overhead within the reserve at every size above the floor', () => {
    for (const size of [32 * KIB, 64 * KIB, 256 * KIB, MIB, 4 * MIB, 33 * MIB, 320 * MIB]) {
      const geometry = parityGeometry(size, DEFAULT_PROPORTION);
      expect(paritySidecarByteCount(geometry) / size).toBeLessThanOrEqual(0.13);
    }
  });

  // spec: FEC
  it('scales the parity shard count with the proportion', () => {
    expect(parityGeometry(MIB, 0.03).parityShards).toBe(1);
    expect(parityGeometry(MIB, 0.5).parityShards).toBe(16);
    // A proportion small enough to round to nothing still buys one shard.
    expect(parityGeometry(MIB, 0.001).parityShards).toBe(1);
  });
});

describe('coverage', () => {
  // spec: FEC
  it('covers every blob central holds, and only the outbox on a facility', () => {
    const cached = { size: MIB, tier: BLOB_TIERS.CACHE };
    expect(isParityCovered(cached, { coveredTiers: CENTRAL_PARITY_TIERS })).toBe(true);
    expect(isParityCovered(cached, { coveredTiers: FACILITY_PARITY_TIERS })).toBe(false);
    expect(
      isParityCovered(
        { size: MIB, tier: BLOB_TIERS.OUTBOX },
        { coveredTiers: FACILITY_PARITY_TIERS },
      ),
    ).toBe(true);
  });

  // spec: FEC
  it('skips blobs below the size floor whatever their tier', () => {
    expect(
      isParityCovered(
        { size: MINIMUM_COVERED_BLOB_SIZE - 1, tier: BLOB_TIERS.OUTBOX },
        { coveredTiers: CENTRAL_PARITY_TIERS },
      ),
    ).toBe(false);
    expect(
      isParityCovered(
        { size: MINIMUM_COVERED_BLOB_SIZE, tier: BLOB_TIERS.OUTBOX },
        { coveredTiers: CENTRAL_PARITY_TIERS },
      ),
    ).toBe(true);
  });
});

describe('reconstruction from seeded corruption', () => {
  const blob = content(256 * KIB);
  const geometry = parityGeometry(256 * KIB, DEFAULT_PROPORTION);
  const firstParityShard = geometry.dataShards;

  // spec: FEC
  it('recovers a single damaged shard byte for byte', () => {
    expectSameBytes(joinShards(recoverGroup(blob, geometry, 0, { corrupt: [7] }), blob.length), blob);
  });

  // spec: FEC
  it('recovers damage exactly at the parity budget', () => {
    expectSameBytes(
      joinShards(recoverGroup(blob, geometry, 0, { corrupt: [3, 11, 29] }), blob.length),
      blob,
    );
  });

  // spec: FEC
  it('recovers a contiguous run within the budget', () => {
    expectSameBytes(
      joinShards(recoverGroup(blob, geometry, 0, { corrupt: [14, 15, 16] }), blob.length),
      blob,
    );
  });

  // spec: FEC
  it('recovers damage spanning data and parity shards', () => {
    expectSameBytes(
      joinShards(
        recoverGroup(blob, geometry, 0, { corrupt: [5, firstParityShard + 1] }),
        blob.length,
      ),
      blob,
    );
  });

  // spec: FEC
  it('leaves the blob whole when only its parity is damaged', () => {
    expectSameBytes(
      joinShards(
        recoverGroup(blob, geometry, 0, { corrupt: [firstParityShard, firstParityShard + 2] }),
        blob.length,
      ),
      blob,
    );
  });

  // spec: FEC
  it('fails cleanly beyond the budget rather than emitting bytes', () => {
    expect(() => recoverGroup(blob, geometry, 0, { corrupt: [1, 2, 3, 4] })).toThrow(
      ParityBudgetExceededError,
    );
    expect(() => recoverGroup(blob, geometry, 0, { corrupt: [8, 9, 10, 11, 12] })).toThrow(
      ParityBudgetExceededError,
    );
  });

  // spec: FEC
  it('recovers identically on repeated calls in one process', () => {
    const recover = () =>
      joinShards(recoverGroup(blob, geometry, 0, { corrupt: [2, 20] }), blob.length);
    const first = recover();
    expectSameBytes(recover(), first);
    expectSameBytes(recover(), first);
  });

  // spec: FEC
  it('regenerating parity over an intact blob reproduces it byte for byte', () => {
    const before = encodeGroupParity(blob, geometry, 0);
    const after = encodeGroupParity(blob, geometry, 0);
    before.forEach((shard, index) => expectSameBytes(after[index], shard));
  });

  // spec: FEC
  // Why the repair path's hash check can never be made conditional: shard 7 is
  // the damaged one, but told it was shard 6, the decoder reports success and
  // emits bytes that are not the blob.
  it('emits wrong bytes when the damage is located wrongly', () => {
    const emitted = joinShards(
      recoverGroup(blob, geometry, 0, { corrupt: [7], erase: [6] }),
      blob.length,
    );
    expectDifferentBytes(emitted, blob);
  });
});

// Real geometry only groups a blob above 32 MiB, which is too much to allocate
// per case; these drive the same paths through a hand-built geometry.
describe('reconstruction across shard groups', () => {
  const geometry: ParityGeometry = {
    shardSize: 4 * KIB,
    dataShards: 5,
    parityShards: 2,
    groupCount: 2,
  };

  // spec: FEC
  it('recovers a group of a blob that fills every shard slot', () => {
    const size = 10 * 4 * KIB;
    const blob = content(size, 11);
    const recovered = recoverGroup(blob, geometry, 1, { corrupt: [0, 4] });
    const start = groupStart(geometry, 1);
    expectSameBytes(joinShards(recovered, size - start), blob.subarray(start));
  });

  // spec: FEC
  it('recovers a last group holding an unfilled shard slot', () => {
    const size = 9 * 4 * KIB;
    const blob = content(size, 13);
    expect(groupDataShardCount(geometry, 1, size)).toBe(4);

    const recovered = recoverGroup(blob, geometry, 1, { corrupt: [1] });
    const start = groupStart(geometry, 1);
    expectSameBytes(joinShards(recovered, size - start), blob.subarray(start));
  });

  // spec: FEC
  it('recovers a short final shard without padding leaking into the blob', () => {
    const size = 8 * 4 * KIB + 137;
    const blob = content(size, 17);
    const recovered = recoverGroup(blob, geometry, 1, { corrupt: [3] });
    const start = groupStart(geometry, 1);
    expectSameBytes(joinShards(recovered, size - start), blob.subarray(start));
  });
});

describe('sidecar layout', () => {
  const geometry = parityGeometry(MIB, DEFAULT_PROPORTION);

  // spec: FEC
  it('is skipped by the store walk, so the scrub reads it as parity', () => {
    const hash = `sha256:${'ab'.repeat(32)}`;
    const segments = blobPathSegments(hash);
    expect(blobHashFromPathSegments(segments)).toBe(hash);

    const sidecar = [...segments.slice(0, 3), `${segments[3]}${PARITY_SIDECAR_SUFFIX}`];
    expect(blobHashFromPathSegments(sidecar)).toBeNull();
  });

  // spec: FEC
  it('round-trips the geometry it was written with', () => {
    const header = decodeParityHeader(encodeParityHeader(geometry, MIB));
    expect(header.geometry).toEqual(geometry);
    expect(header.blobSize).toBe(MIB);
  });

  it('rejects bytes that are not a sidecar', () => {
    expect(() => decodeParityHeader(new Uint8Array(PARITY_HEADER_BYTES))).toThrow(
      'not a parity sidecar',
    );
    expect(() => decodeParityHeader(new Uint8Array(4))).toThrow('header is 4 bytes');
  });

  // spec: FEC
  it('lays out digests then parity, with no region overlapping another', () => {
    const lastDigest = shardDigestOffset(
      geometry,
      geometry.groupCount - 1,
      geometry.dataShards + geometry.parityShards - 1,
    );
    expect(lastDigest).toBeGreaterThanOrEqual(PARITY_HEADER_BYTES);
    expect(parityShardOffset(geometry, 0, 0)).toBeGreaterThan(lastDigest);

    const lastParity = parityShardOffset(
      geometry,
      geometry.groupCount - 1,
      geometry.parityShards - 1,
    );
    expect(lastParity + geometry.shardSize).toBe(paritySidecarByteCount(geometry));
  });
});
