import { describe, expect, it } from 'vitest';

import { Asset } from '../../src/models/Asset';

// spec: ASSET
// Assets sync from central to every facility. A row stored on the blob store
// carries its hash and no inline bytes, so the sanitisers on both sides have to
// let a null through — coercing it strands the row (and its hash) at ingest,
// leaving the facility unable to fetch or print the image.
describe('Asset sync sanitisers', () => {
  const bytes = Buffer.from('image-bytes');

  describe.each([
    ['sanitizeForFacilityServer', Asset.sanitizeForFacilityServer.bind(Asset)],
    ['sanitizeForCentralServer', Asset.sanitizeForCentralServer.bind(Asset)],
  ])('%s', (_name, sanitize) => {
    it('passes a hash-form row through with null data', () => {
      const result = sanitize({ name: 'letterhead-logo', hash: 'sha256:abc', data: null });
      expect(result.data).toBeNull();
      expect(result.hash).toBe('sha256:abc');
    });

    it('tolerates an absent data field', () => {
      expect(sanitize({ name: 'letterhead-logo', hash: 'sha256:abc' }).data).toBeNull();
    });

    it('still decodes a legacy postgres hex string', () => {
      const result = sanitize({ data: `\\x${bytes.toString('hex')}` });
      expect(result.data).toEqual(bytes);
    });

    it('still accepts legacy raw bytes', () => {
      expect(sanitize({ data: bytes }).data).toEqual(bytes);
    });

    it('preserves the other columns', () => {
      const result = sanitize({ name: 'letterhead-logo', type: 'image/png', data: null });
      expect(result).toMatchObject({ name: 'letterhead-logo', type: 'image/png' });
    });
  });

  it('decodes a base64 string on the central sanitiser', () => {
    const result = Asset.sanitizeForCentralServer({ data: bytes.toString('base64') });
    expect(result.data).toEqual(bytes);
  });
});
