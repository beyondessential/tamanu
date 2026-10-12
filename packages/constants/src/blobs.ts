// spec: CAS
export const BLOB_HASH_ALGORITHMS = {
  SHA256: 'sha256',
} as const;

export type BlobHashAlgorithm = (typeof BLOB_HASH_ALGORITHMS)[keyof typeof BLOB_HASH_ALGORITHMS];

// Existing blobs keep the algorithm in their tagged hash, so changing this migrates nothing.
export const CURRENT_BLOB_HASH_ALGORITHM: BlobHashAlgorithm = BLOB_HASH_ALGORITHMS.SHA256;

// spec: SCRUB
// Infected content hashes correctly, so its verdict is recorded separately (BLOB_SCAN_VERDICTS).
export const BLOB_INTEGRITY_STATES = {
  VERIFIED: 'verified',
  CORRUPT: 'corrupt',
  ABSENT: 'absent',
} as const;

export type BlobIntegrityState = (typeof BLOB_INTEGRITY_STATES)[keyof typeof BLOB_INTEGRITY_STATES];

export const BLOB_INTEGRITY_STATES_VALUES = Object.values(BLOB_INTEGRITY_STATES);

// spec: AV
// No recorded scan is the third case, which is every blob on a deployment with no scanner.
export const BLOB_SCAN_VERDICTS = {
  CLEAN: 'clean',
  INFECTED: 'infected',
} as const;

export type BlobScanVerdict = (typeof BLOB_SCAN_VERDICTS)[keyof typeof BLOB_SCAN_VERDICTS];

export const BLOB_SCAN_VERDICTS_VALUES = Object.values(BLOB_SCAN_VERDICTS);

// spec: AV
// Each posture serves a subset of what the one before it serves.
export const BLOB_SERVE_POLICIES = {
  OFF: 'off',
  UNLESS_KNOWN_BAD: 'unless-known-bad',
  ONLY_KNOWN_GOOD: 'only-known-good',
} as const;

export type BlobServePolicy = (typeof BLOB_SERVE_POLICIES)[keyof typeof BLOB_SERVE_POLICIES];

export const BLOB_SERVE_POLICIES_VALUES = Object.values(BLOB_SERVE_POLICIES);

// spec: AV
// With no scanner named, every blob stays unscanned and the serve policy reads as off.
export const BLOB_SCANNERS = {
  NONE: 'none',
  CLAMD: 'clamd',
} as const;

export type BlobScanner = (typeof BLOB_SCANNERS)[keyof typeof BLOB_SCANNERS];

export const BLOB_SCANNERS_VALUES = Object.values(BLOB_SCANNERS);

// spec: CACHE
// Not consulted on central, whose registry is authoritative.
export const BLOB_TIERS = {
  OUTBOX: 'outbox',
  CACHE: 'cache',
} as const;

export type BlobTier = (typeof BLOB_TIERS)[keyof typeof BLOB_TIERS];

export const BLOB_TIERS_VALUES = Object.values(BLOB_TIERS);

// spec: XFER, AV
export const BLOB_AVAILABILITY_STATES = {
  AVAILABLE: 'available',
  AWAITING_UPLOAD: 'awaiting-upload',
  AWAITING_FETCH: 'awaiting-fetch',
  AWAITING_SCAN: 'awaiting-scan',
  WITHHELD_INFECTED: 'withheld-infected',
} as const;

export type BlobAvailabilityState =
  (typeof BLOB_AVAILABILITY_STATES)[keyof typeof BLOB_AVAILABILITY_STATES];

// spec: SERVE
// Inline consumers upload base64 within the JSON body, so this must sit above three quarters of
// that body limit or accepted content can't be read back inline.
export const MAX_INLINE_BLOB_BYTES = 48 * 1024 * 1024;

// spec: XFER
export const BLOB_OFFER_STATUSES = {
  ALREADY_STORED: 'already-stored',
  WANTED: 'wanted',
} as const;

export type BlobOfferStatus = (typeof BLOB_OFFER_STATUSES)[keyof typeof BLOB_OFFER_STATUSES];
