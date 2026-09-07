import { describe, expect, it } from 'vitest';

import { Asset } from '../../src/models/Asset';
import { Attachment } from '../../src/models/Attachment';

// spec: BKFL
// A backfilled row syncs carrying its hash and no bytes. The sanitizers run on
// every synced row, so they have to accept that shape rather than assuming
// there is always content to turn into a Buffer.
describe('sanitizing a reference row with no bytes', () => {
  it('passes a backfilled asset through to the central server', () => {
    const sanitized = Asset.sanitizeForCentralServer({
      id: 'asset-1',
      name: 'letterhead',
      data: null,
      hash: 'sha256:abc',
    } as any);

    expect(sanitized.data).toBeNull();
    expect(sanitized.hash).toBe('sha256:abc');
  });

  it('passes a backfilled asset through to a facility server', () => {
    const sanitized = Asset.sanitizeForFacilityServer({
      id: 'asset-1',
      data: null,
      hash: 'sha256:abc',
    });

    expect(sanitized.data).toBeNull();
    expect(sanitized.hash).toBe('sha256:abc');
  });

  it('passes a backfilled attachment through', () => {
    const sanitized = Attachment.sanitizeForDatabase({
      id: 'attachment-1',
      data: null,
      hash: 'sha256:abc',
    } as any);

    expect(sanitized.data).toBeNull();
    expect(sanitized.hash).toBe('sha256:abc');
  });

  it('still decodes content for a row that has not been backfilled', () => {
    const content = Buffer.from('still in the database');
    const asset = Asset.sanitizeForFacilityServer({
      id: 'asset-1',
      data: `\\x${content.toString('hex')}`,
    });
    const attachment = Attachment.sanitizeForDatabase({
      id: 'attachment-1',
      data: content.toString('base64'),
    } as any);

    expect(asset.data).toEqual(content);
    expect(attachment.data).toEqual(content);
  });
});
