// spec: CAS
export const BLOB_HASH_ALGORITHMS = {
  SHA256: 'sha256',
} as const;

export type BlobHashAlgorithm = (typeof BLOB_HASH_ALGORITHMS)[keyof typeof BLOB_HASH_ALGORITHMS];

// The algorithm used to hash newly admitted content. Existing blobs keep the
// algorithm recorded in their tagged hash, so changing this is a value change,
// not a migration of stored content.
export const CURRENT_BLOB_HASH_ALGORITHM: BlobHashAlgorithm = BLOB_HASH_ALGORITHMS.SHA256;

// spec: SCRUB
// A blob's standing against its hash. `verified` content matched when it was
// last checked; `quarantined` content failed and is retained for investigation
// but never served; `absent` is a registry entry whose bytes the store does not
// hold, which the server acquires rather than offers.
export const BLOB_INTEGRITY_STATES = {
  VERIFIED: 'verified',
  QUARANTINED: 'quarantined',
  ABSENT: 'absent',
} as const;

export type BlobIntegrityState = (typeof BLOB_INTEGRITY_STATES)[keyof typeof BLOB_INTEGRITY_STATES];

export const BLOB_INTEGRITY_STATES_VALUES = Object.values(BLOB_INTEGRITY_STATES);

// spec: CACHE
// The durability tier of a blob on a facility or mobile server. An outbox blob
// is the only durable copy of its content — never evicted, awaiting central's
// acknowledgement. A cache blob is durable on the central server and evictable
// under the LRU size budget. On the central server the registry is
// authoritative and the tier is not consulted.
export const BLOB_TIERS = {
  OUTBOX: 'outbox',
  CACHE: 'cache',
} as const;

export type BlobTier = (typeof BLOB_TIERS)[keyof typeof BLOB_TIERS];

export const BLOB_TIERS_VALUES = Object.values(BLOB_TIERS);

// spec: XFER
// The availability of a referenced blob's bytes on a serving server. A
// content-pending reference is awaiting either upload from its origin or fetch
// by the serving server; the two are distinguished so a client can tell them
// apart without a further request.
export const BLOB_AVAILABILITY_STATES = {
  AVAILABLE: 'available',
  AWAITING_UPLOAD: 'awaiting-upload',
  AWAITING_FETCH: 'awaiting-fetch',
} as const;

export type BlobAvailabilityState =
  (typeof BLOB_AVAILABILITY_STATES)[keyof typeof BLOB_AVAILABILITY_STATES];

// spec: XFER
// A receiving server's answer to a blob being offered: content it already
// holds is skipped, otherwise it reports how many bytes it has already staged
// so the origin resumes from there.
export const BLOB_OFFER_STATUSES = {
  ALREADY_STORED: 'already-stored',
  WANTED: 'wanted',
} as const;

export type BlobOfferStatus = (typeof BLOB_OFFER_STATUSES)[keyof typeof BLOB_OFFER_STATUSES];
