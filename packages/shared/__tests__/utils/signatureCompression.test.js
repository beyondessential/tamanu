import { expect } from 'chai';

import {
  compressSignatureBody,
  decompressSignatureBody,
} from '../../src/utils/signatureCompression';

describe('signatureCompression', () => {
  it('round-trips centreline JSON', async () => {
    const body = '[[240,75],[242,76],[245,80]]';

    const compressed = await compressSignatureBody(body);
    expect(compressed).to.be.a('string');
    expect(compressed).not.to.equal(body);

    const decompressed = await decompressSignatureBody(compressed);
    expect(decompressed).to.equal(body);
  });

  it('returns empty string for empty input', async () => {
    expect(await compressSignatureBody('')).to.equal('');
    expect(await decompressSignatureBody('')).to.equal('');
  });

  it('storage compress and API decompress round-trip', async () => {
    const body = '[[10,20]]';
    const stored = await compressSignatureBody(body);
    expect(stored).not.to.equal(body);

    const apiBody = await decompressSignatureBody(stored);
    expect(apiBody).to.equal(body);
  });
});
