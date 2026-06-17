import { expect } from 'chai';

import { bodyToDrawPaths, mergeStrokesIntoBody } from '../../src/utils/signature';

describe('signaturePathUtils', () => {
  it('converts centreline JSON to SVG path commands', () => {
    const body = JSON.stringify([
      [
        [10, 10],
        [50, 50],
      ],
    ]);

    const paths = bodyToDrawPaths(body);
    expect(paths).to.have.lengthOf(1);
    expect(paths[0]).to.match(/^M /);
  });

  it('merges new strokes into an existing body', () => {
    const existing = JSON.stringify([[[1, 1]]]);
    const merged = mergeStrokesIntoBody(existing, [[{ x: 2, y: 2 }]]);

    expect(JSON.parse(merged)).to.deep.equal([
      [[1, 1]],
      [[2, 2]],
    ]);
  });
});
