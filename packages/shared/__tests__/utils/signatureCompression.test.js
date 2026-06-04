import { expect } from 'chai';

import {
  compressSignatureBody,
  decompressSignatureBody,
  isUncompressedSignatureBody,
  prepareSignatureBodyForApi,
  prepareSignatureBodyForStorage,
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

  it('detects uncompressed centreline JSON', () => {
    expect(isUncompressedSignatureBody('[[1,2]]')).to.be.true;
    expect(isUncompressedSignatureBody('H4sIAAAA')).to.be.false;
    expect(isUncompressedSignatureBody('')).to.be.false;
  });

  it('prepare helpers round-trip storage and API formats', async () => {
    const body = '[[10,20]]';
    const stored = await prepareSignatureBodyForStorage(body);
    expect(stored).not.to.equal(body);

    const apiBody = await prepareSignatureBodyForApi(stored);
    expect(apiBody).to.equal(body);
  });

  it('prepare helpers pass through empty values', async () => {
    expect(await prepareSignatureBodyForStorage('')).to.equal('');
    expect(await prepareSignatureBodyForApi('')).to.equal('');
    expect(await prepareSignatureBodyForStorage(null)).to.equal('');
    expect(await prepareSignatureBodyForApi(null)).to.equal('');
  });
});
