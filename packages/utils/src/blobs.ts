// spec: CAS
// Pure helpers for algorithm-tagged blob hashes and the on-disk fan-out layout.
// Dependency-free so they can be used from both servers and mobile.

const TAGGED_HASH_PATTERN = /^(?<algorithm>[a-z0-9]+):(?<digest>[0-9a-f]+)$/;

// Digest lengths (lowercase-hex characters) for each supported algorithm. The
// fan-out consumes the first four characters, so digests must be longer than
// that; validating exact lengths catches truncated hashes before they become
// file paths.
const DIGEST_LENGTHS: Record<string, number> = {
  sha256: 64,
};

export interface ParsedBlobHash {
  algorithm: string;
  digest: string;
}

export function formatBlobHash(algorithm: string, hexDigest: string): string {
  return `${algorithm}:${hexDigest.toLowerCase()}`;
}

export function parseBlobHash(hash: string): ParsedBlobHash {
  const match = TAGGED_HASH_PATTERN.exec(hash);
  if (!match?.groups) {
    throw new Error(`Invalid blob hash: expected algorithm-tagged lowercase hex, got "${hash}"`);
  }
  const { algorithm, digest } = match.groups;
  const expectedLength = DIGEST_LENGTHS[algorithm];
  if (expectedLength === undefined) {
    throw new Error(`Invalid blob hash: unknown algorithm "${algorithm}"`);
  }
  if (digest.length !== expectedLength) {
    throw new Error(
      `Invalid blob hash: ${algorithm} digest must be ${expectedLength} hex characters, got ${digest.length}`,
    );
  }
  return { algorithm, digest };
}

// A blob's path relative to the store root, as segments for the caller to join
// with its platform separator: the algorithm name, a two-level fan-out of the
// first two bytes of the digest, then the remainder as the filename
// (e.g. sha256/ab/cd/<rest>). All components are lowercase hex so the layout
// is stable on case-insensitive filesystems.
export function blobPathSegments(hash: string): [string, string, string, string] {
  const { algorithm, digest } = parseBlobHash(hash);
  return [algorithm, digest.slice(0, 2), digest.slice(2, 4), digest.slice(4)];
}

// spec: SCRUB
// The inverse of blobPathSegments, for walking the store's own contents: the
// hash a stored file's location encodes, or null where the path is not a blob's.
// The store root also holds the staging and temp directories, so anything that
// does not reconstruct into a valid hash is simply not content.
export function blobHashFromPathSegments(segments: string[]): string | null {
  if (segments.length !== 4) {
    return null;
  }
  const [algorithm, firstByte, secondByte, remainder] = segments;
  try {
    const hash = formatBlobHash(algorithm, `${firstByte}${secondByte}${remainder}`);
    // Round-trip rather than trusting the parse alone: it confirms the fan-out
    // split itself is right, so a file misplaced under another blob's
    // directories is rejected instead of being adopted under a hash its
    // location does not actually encode.
    parseBlobHash(hash);
    return blobPathSegments(hash).join('/') === segments.join('/') ? hash : null;
  } catch {
    return null;
  }
}
