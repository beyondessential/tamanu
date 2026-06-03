import { expect } from 'chai';

import {
  compressSignatureBody,
  decompressSignatureBody,
} from '../../src/utils/signatureCompression';

export async function c(body) {
  if (!body) return '';

  const byteArray = new TextEncoder().encode(body);
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const buffer = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buffer).toBase64();
}

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
});
