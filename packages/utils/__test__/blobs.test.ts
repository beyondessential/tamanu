import { describe, expect, it } from 'vitest';
import { blobPathSegments, formatBlobHash, parseBlobHash } from '../src/blobs';

// SHA-256 of empty content
const EMPTY_DIGEST = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const EMPTY_HASH = `sha256:${EMPTY_DIGEST}`;

describe('formatBlobHash', () => {
  it('tags the digest with the algorithm', () => {
    expect(formatBlobHash('sha256', EMPTY_DIGEST)).toBe(EMPTY_HASH);
  });

  it('lowercases the digest', () => {
    expect(formatBlobHash('sha256', EMPTY_DIGEST.toUpperCase())).toBe(EMPTY_HASH);
  });
});

describe('parseBlobHash', () => {
  it('splits algorithm and digest', () => {
    expect(parseBlobHash(EMPTY_HASH)).toEqual({ algorithm: 'sha256', digest: EMPTY_DIGEST });
  });

  it('rejects an untagged digest', () => {
    expect(() => parseBlobHash(EMPTY_DIGEST)).toThrow(/algorithm-tagged/);
  });

  it('rejects uppercase hex', () => {
    expect(() => parseBlobHash(`sha256:${EMPTY_DIGEST.toUpperCase()}`)).toThrow(
      /algorithm-tagged/,
    );
  });

  it('rejects an unknown algorithm', () => {
    expect(() => parseBlobHash(`md5:${EMPTY_DIGEST}`)).toThrow(/unknown algorithm/);
  });

  it('rejects a truncated digest', () => {
    expect(() => parseBlobHash(`sha256:${EMPTY_DIGEST.slice(0, 40)}`)).toThrow(
      /64 hex characters/,
    );
  });

  it('rejects non-hex characters', () => {
    expect(() => parseBlobHash(`sha256:${'g'.repeat(64)}`)).toThrow(/algorithm-tagged/);
  });
});

describe('blobPathSegments', () => {
  it('fans out the first two bytes of the digest', () => {
    expect(blobPathSegments(EMPTY_HASH)).toEqual([
      'sha256',
      'e3',
      'b0',
      EMPTY_DIGEST.slice(4),
    ]);
  });
});
