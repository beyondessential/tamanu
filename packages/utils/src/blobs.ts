// spec: CAS
// Dependency-free so both servers and mobile can use them.

const TAGGED_HASH_PATTERN = /^(?<algorithm>[a-z0-9]+):(?<digest>[0-9a-f]+)$/;

// Exact lengths catch truncated hashes before they become file paths.
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

// All components are lowercase hex, so the layout is stable on case-insensitive filesystems.
export function blobPathSegments(hash: string): [string, string, string, string] {
  const { algorithm, digest } = parseBlobHash(hash);
  return [algorithm, digest.slice(0, 2), digest.slice(2, 4), digest.slice(4)];
}

// spec: SCRUB
export function blobHashFromPathSegments(segments: string[]): string | null {
  if (segments.length !== 4) {
    return null;
  }
  const [algorithm, firstByte, secondByte, remainder] = segments;
  try {
    const hash = formatBlobHash(algorithm, `${firstByte}${secondByte}${remainder}`);
    // Round-trip, so a file misplaced under another blob's directories is rejected rather than
    // adopted.
    parseBlobHash(hash);
    return blobPathSegments(hash).join('/') === segments.join('/') ? hash : null;
  } catch {
    return null;
  }
}
