import { BLOB_TIERS, BLOB_TIERS_VALUES, type BlobTier } from '@tamanu/constants';

// spec: FEC
// Systematic Reed-Solomon over GF(256): the blob's bytes are the data shards.

// A parity shard is at least one filesystem cluster, so below this the sidecar outgrows the blob:
// 32 KiB gives 8+1 at 12.8% overhead.
export const MINIMUM_COVERED_BLOB_SIZE = 32 * 1024;

// spec: FEC
// A facility covers only its outbox: a corrupt cache copy costs just a refetch from central.
export const CENTRAL_PARITY_TIERS: readonly BlobTier[] = BLOB_TIERS_VALUES;
export const FACILITY_PARITY_TIERS: readonly BlobTier[] = [BLOB_TIERS.OUTBOX];

// Cluster-aligned, so one bad cluster damages exactly one shard.
const CLUSTER_SIZE = 4 * 1024;
const MAX_SHARD_SIZE = 1024 * 1024;

// Encode cost is parityShards × blobSize, so capping the group keeps throughput flat.
const MAX_SHARDS_PER_GROUP = 32;

// Every subscript here is in range by construction; the non-null assertions are for
// noUncheckedIndexedAccess.
const FIELD_SIZE = 256;
// x^8 + x^4 + x^3 + x^2 + 1, for which 2 is a primitive root.
const FIELD_POLYNOMIAL = 0x11d;

const EXPONENTIALS = new Uint8Array(FIELD_SIZE * 2);
const LOGARITHMS = new Uint8Array(FIELD_SIZE);
const PRODUCTS = new Uint8Array(FIELD_SIZE * FIELD_SIZE);

for (let power = 0, value = 1; power < FIELD_SIZE - 1; power++) {
  EXPONENTIALS[power] = value;
  LOGARITHMS[value] = power;
  value <<= 1;
  if (value & FIELD_SIZE) {
    value ^= FIELD_POLYNOMIAL;
  }
}
// Wrapped copy, so a sum of two logarithms indexes without a modulo.
for (let power = FIELD_SIZE - 1; power < EXPONENTIALS.length; power++) {
  EXPONENTIALS[power] = EXPONENTIALS[power - (FIELD_SIZE - 1)]!;
}
for (let left = 1; left < FIELD_SIZE; left++) {
  for (let right = 1; right < FIELD_SIZE; right++) {
    PRODUCTS[left * FIELD_SIZE + right] = EXPONENTIALS[LOGARITHMS[left]! + LOGARITHMS[right]!]!;
  }
}

function divide(dividend: number, divisor: number): number {
  if (divisor === 0) {
    throw new Error('Parity codec: division by zero in GF(256)');
  }
  if (dividend === 0) {
    return 0;
  }
  return EXPONENTIALS[LOGARITHMS[dividend]! - LOGARITHMS[divisor]! + (FIELD_SIZE - 1)]!;
}

function productsOf(coefficient: number): Uint8Array {
  return PRODUCTS.subarray(coefficient * FIELD_SIZE, (coefficient + 1) * FIELD_SIZE);
}

export interface ParityGeometry {
  shardSize: number;
  /**
   * The last group may hold fewer real shards; the slots past its end are zeros and never stored.
   */
  dataShards: number;
  parityShards: number;
  groupCount: number;
}

// spec: FEC
/** At the 10% default a 1 MiB blob is 32+3, recovering any 3 of its 35 shards. */
export function parityGeometry(blobSize: number, proportion: number): ParityGeometry {
  const shardSize = Math.min(
    MAX_SHARD_SIZE,
    Math.max(CLUSTER_SIZE, roundUpToCluster(Math.ceil(blobSize / MAX_SHARDS_PER_GROUP))),
  );
  const totalDataShards = Math.max(1, Math.ceil(blobSize / shardSize));
  const groupCount = Math.ceil(totalDataShards / MAX_SHARDS_PER_GROUP);
  // Spread over the groups so the last is never a runt carrying a full group's parity.
  const dataShards = Math.ceil(totalDataShards / groupCount);
  const parityShards = Math.min(
    MAX_SHARDS_PER_GROUP,
    Math.max(1, Math.round(proportion * dataShards)),
  );
  return { shardSize, dataShards, parityShards, groupCount };
}

function roundUpToCluster(bytes: number): number {
  return Math.ceil(bytes / CLUSTER_SIZE) * CLUSTER_SIZE;
}

export function groupStart(geometry: ParityGeometry, groupIndex: number): number {
  return groupIndex * geometry.dataShards * geometry.shardSize;
}

export function groupDataShardCount(
  geometry: ParityGeometry,
  groupIndex: number,
  blobSize: number,
): number {
  const remaining = blobSize - groupStart(geometry, groupIndex);
  return Math.min(geometry.dataShards, Math.ceil(remaining / geometry.shardSize));
}

// spec: FEC
/** A sidecar header is bytes on disk too, and a damaged one sizes every read that follows. */
export function isEncodableGeometry(geometry: ParityGeometry, blobSize: number): boolean {
  const { shardSize, dataShards, parityShards, groupCount } = geometry;
  return (
    dataShards >= 1 &&
    dataShards <= MAX_SHARDS_PER_GROUP &&
    parityShards >= 1 &&
    parityShards <= MAX_SHARDS_PER_GROUP &&
    shardSize >= CLUSTER_SIZE &&
    shardSize <= MAX_SHARD_SIZE &&
    shardSize % CLUSTER_SIZE === 0 &&
    groupCount >= 1 &&
    // Bounds a groupCount claiming billions of groups.
    groupStart(geometry, groupCount - 1) < blobSize &&
    groupCount * dataShards * shardSize >= blobSize
  );
}

export interface ParityCoverage {
  coveredTiers: readonly BlobTier[];
}

// spec: FEC
export function isParityCovered(
  { size, tier }: { size: number; tier: BlobTier },
  { coveredTiers }: ParityCoverage,
): boolean {
  return size >= MINIMUM_COVERED_BLOB_SIZE && coveredTiers.includes(tier);
}

// spec: FEC
// The top rows are the identity and the parity rows a Cauchy matrix, so any dataShards of the
// shards reconstruct the blob.
function encodingMatrix({ dataShards, parityShards }: ParityGeometry): Uint8Array {
  const rows = dataShards + parityShards;
  const matrix = new Uint8Array(rows * dataShards);
  for (let shard = 0; shard < dataShards; shard++) {
    matrix[shard * dataShards + shard] = 1;
  }
  for (let parity = 0; parity < parityShards; parity++) {
    for (let data = 0; data < dataShards; data++) {
      // The two index sets are disjoint (data below MAX_SHARDS_PER_GROUP, parity
      // at or above it), so no denominator is ever zero.
      matrix[(dataShards + parity) * dataShards + data] = divide(
        1,
        (MAX_SHARDS_PER_GROUP + parity) ^ data,
      );
    }
  }
  return matrix;
}

// spec: FEC
/**
 * Only the parity accumulators stay resident, so memory is shardSize × parityShards whatever the
 * blob's size.
 */
export class ParityEncoder {
  readonly #geometry: ParityGeometry;
  readonly #matrix: Uint8Array;
  readonly #parity: Uint8Array[];

  constructor(geometry: ParityGeometry) {
    this.#geometry = geometry;
    this.#matrix = encodingMatrix(geometry);
    this.#parity = Array.from(
      { length: geometry.parityShards },
      () => new Uint8Array(geometry.shardSize),
    );
  }

  beginGroup(): void {
    for (const shard of this.#parity) {
      shard.fill(0);
    }
  }

  /** A short final shard is equivalent to zero padding. */
  addDataShard(index: number, bytes: Uint8Array): void {
    const { dataShards, parityShards } = this.#geometry;
    if (index < 0 || index >= dataShards) {
      throw new Error(`Parity codec: data shard ${index} is outside a group of ${dataShards}`);
    }
    for (let parity = 0; parity < parityShards; parity++) {
      const products = productsOf(this.#matrix[(dataShards + parity) * dataShards + index]!);
      const accumulator = this.#parity[parity]!;
      for (let offset = 0; offset < bytes.length; offset++) {
        accumulator[offset] = accumulator[offset]! ^ products[bytes[offset]!]!;
      }
    }
  }

  /** Valid until the next beginGroup. */
  groupParity(): readonly Uint8Array[] {
    return this.#parity;
  }
}

// spec: FEC
/**
 * This corrects erasures only: a wrongly located damaged shard reconstructs "successfully" into
 * different bytes, so callers must verify against the blob hash.
 */
export class ParityDecoder {
  readonly #presentShards: number[];
  readonly #erasedDataShards: number[];
  readonly #recovery: Uint8Array;

  constructor(
    geometry: ParityGeometry,
    { present, erased }: { present: readonly number[]; erased: readonly number[] },
  ) {
    const { dataShards, parityShards } = geometry;
    if (present.length < dataShards) {
      throw new ParityBudgetExceededError(
        `${present.length} of ${dataShards + parityShards} shards present, ${dataShards} needed`,
      );
    }
    // Surviving data shards first: their rows are the identity.
    this.#presentShards = [...present].sort((a, b) => a - b).slice(0, dataShards);
    this.#erasedDataShards = [...erased].sort((a, b) => a - b);

    const matrix = encodingMatrix(geometry);
    const survivingRows = new Uint8Array(dataShards * dataShards);
    this.#presentShards.forEach((shard, row) => {
      survivingRows.set(matrix.subarray(shard * dataShards, (shard + 1) * dataShards), row * dataShards);
    });
    const solved = invert(survivingRows, dataShards);

    this.#recovery = new Uint8Array(this.#erasedDataShards.length * dataShards);
    this.#erasedDataShards.forEach((shard, row) => {
      this.#recovery.set(solved.subarray(shard * dataShards, (shard + 1) * dataShards), row * dataShards);
    });
  }

  get requiredShards(): readonly number[] {
    return this.#presentShards;
  }

  /** Every present slice must be the same length. */
  recoverSlice(presentSlices: readonly Uint8Array[]): Uint8Array[] {
    if (presentSlices.length !== this.#presentShards.length) {
      throw new Error(
        `Parity codec: ${presentSlices.length} slices supplied for ${this.#presentShards.length} shards`,
      );
    }
    const length = presentSlices[0]?.length ?? 0;
    const columns = this.#presentShards.length;
    const recovered = this.#erasedDataShards.map(() => new Uint8Array(length));
    for (let row = 0; row < recovered.length; row++) {
      const output = recovered[row]!;
      for (let column = 0; column < columns; column++) {
        const coefficient = this.#recovery[row * columns + column]!;
        if (coefficient === 0) {
          continue;
        }
        const products = productsOf(coefficient);
        const slice = presentSlices[column]!;
        for (let offset = 0; offset < length; offset++) {
          output[offset] = output[offset]! ^ products[slice[offset]!]!;
        }
      }
    }
    return recovered;
  }
}

// spec: FEC
// Distinct from codec misuse, so the healer falls through to the rest of the self-heal ladder.
export class ParityBudgetExceededError extends Error {
  constructor(message: string) {
    super(`Parity cannot recover this blob: ${message}`);
    this.name = 'ParityBudgetExceededError';
  }
}

// Gauss-Jordan over GF(256). A singular pivot means the caller passed an invalid row set.
function invert(matrix: Uint8Array, order: number): Uint8Array {
  const work = Uint8Array.from(matrix);
  const inverse = new Uint8Array(order * order);
  for (let row = 0; row < order; row++) {
    inverse[row * order + row] = 1;
  }

  for (let column = 0; column < order; column++) {
    let pivot = column;
    while (pivot < order && work[pivot * order + column] === 0) {
      pivot++;
    }
    if (pivot === order) {
      throw new Error('Parity codec: shard set does not reconstruct the blob');
    }
    if (pivot !== column) {
      swapRows(work, pivot, column, order);
      swapRows(inverse, pivot, column, order);
    }

    const leading = work[column * order + column]!;
    if (leading !== 1) {
      const products = productsOf(divide(1, leading));
      scaleRow(work, column, products, order);
      scaleRow(inverse, column, products, order);
    }

    for (let row = 0; row < order; row++) {
      const factor = work[row * order + column]!;
      if (row === column || factor === 0) {
        continue;
      }
      const products = productsOf(factor);
      subtractRow(work, row, column, products, order);
      subtractRow(inverse, row, column, products, order);
    }
  }
  return inverse;
}

function swapRows(matrix: Uint8Array, left: number, right: number, order: number): void {
  const buffer = Uint8Array.from(matrix.subarray(left * order, (left + 1) * order));
  matrix.set(matrix.subarray(right * order, (right + 1) * order), left * order);
  matrix.set(buffer, right * order);
}

function scaleRow(matrix: Uint8Array, row: number, products: Uint8Array, order: number): void {
  for (let column = 0; column < order; column++) {
    matrix[row * order + column] = products[matrix[row * order + column]!]!;
  }
}

function subtractRow(
  matrix: Uint8Array,
  row: number,
  from: number,
  products: Uint8Array,
  order: number,
): void {
  for (let column = 0; column < order; column++) {
    matrix[row * order + column] =
      matrix[row * order + column]! ^ products[matrix[from * order + column]!]!;
  }
}
