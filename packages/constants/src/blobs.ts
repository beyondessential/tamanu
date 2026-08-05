// spec: CAS
export const BLOB_HASH_ALGORITHMS = {
  SHA256: 'sha256',
} as const;

export type BlobHashAlgorithm = (typeof BLOB_HASH_ALGORITHMS)[keyof typeof BLOB_HASH_ALGORITHMS];

// The algorithm used to hash newly admitted content. Existing blobs keep the
// algorithm recorded in their tagged hash, so changing this is a value change,
// not a migration of stored content.
export const CURRENT_BLOB_HASH_ALGORITHM: BlobHashAlgorithm = BLOB_HASH_ALGORITHMS.SHA256;

export const BLOB_INTEGRITY_STATES = {
  VERIFIED: 'verified',
  QUARANTINED: 'quarantined',
} as const;

export type BlobIntegrityState = (typeof BLOB_INTEGRITY_STATES)[keyof typeof BLOB_INTEGRITY_STATES];

export const BLOB_INTEGRITY_STATES_VALUES = Object.values(BLOB_INTEGRITY_STATES);
