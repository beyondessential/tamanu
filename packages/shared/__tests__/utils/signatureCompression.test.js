/**
 * @typedef {[number, number]} Point
 * @typedef {Point[]} Stroke
 * @typedef {Stroke[]} Signature
 */

import { expect } from 'chai';

import {
  compressSignatureBody,
  decompressSignatureBody,
} from '../../src/utils/signature';

const SIGNATURE_WIDTH = 480;
const SIGNATURE_HEIGHT = 144;

/** @returns {Point} */
function randomPoint() {
  return [
    Math.floor(Math.random() * SIGNATURE_WIDTH),
    Math.floor(Math.random() * SIGNATURE_HEIGHT),
  ];
}

/** @returns {Stroke} */
function randomStroke() {
  // Min. 1 point. Single point is a valid stroke; renders as a dot.
  const pointCount = 1 + Math.floor(Math.random() * 40);
  return Array.from({ length: pointCount }, randomPoint);
}

/** @returns {Signature} */
function randomSignature() {
  const strokeCount = 1 + Math.floor(Math.random() * 20);
  return Array.from({ length: strokeCount }, randomStroke);
}

/** @returns {`[[${string}]]`} */
function randomSignatureBody() {
  return JSON.stringify(randomSignature());
}

describe('signatureCompression', () => {
  it('returns empty string for empty input', async () => {
    expect(await compressSignatureBody('')).to.equal('');
    expect(await decompressSignatureBody('')).to.equal('');
  });

  it('round-trips trivial signature', async () => {
    const body = JSON.stringify([
      [
        [240, 75],
        [242, 76],
        [245, 80],
      ],
    ]);

    const compressed = await compressSignatureBody(body);
    expect(compressed).to.be.a('string');
    expect(compressed).not.to.equal(body);

    const decompressed = await decompressSignatureBody(compressed);
    expect(decompressed).to.equal(body);
  });

  it('round-trips randomly generated signatures', async () => {
    for (let i = 0; i < 10; i++) {
      const body = randomSignatureBody();
      const compressed = await compressSignatureBody(body);
      expect(compressed).to.be.a('string');
      expect(compressed).not.to.equal(body);
      const decompressed = await decompressSignatureBody(compressed);
      expect(decompressed).to.equal(body);
    }
  });
});
