import { Readable } from 'node:stream';

import { MAX_INLINE_BLOB_BYTES } from '@tamanu/constants';

import { readBlobAsBase64 } from '../../src/utils/serveBlob';

// spec: SERVE
describe('readBlobAsBase64', () => {
  const CONTENT = Buffer.from('content a client consumes inline', 'utf8');
  const open = () => Readable.from([CONTENT]);

  it('encodes content within the inline limit', async () => {
    const data = await readBlobAsBase64({ size: CONTENT.length, open });
    expect(data).toBe(CONTENT.toString('base64'));
  });

  it('encodes content at exactly the inline limit', async () => {
    const data = await readBlobAsBase64({ size: MAX_INLINE_BLOB_BYTES, open });
    expect(data).toBe(CONTENT.toString('base64'));
  });

  it('refuses content past the inline limit without reading it', async () => {
    const openSpy = jest.fn(open);
    await expect(
      readBlobAsBase64({ size: MAX_INLINE_BLOB_BYTES + 1, open: openSpy }),
    ).rejects.toMatchObject({ status: 422 });
    expect(openSpy).not.toHaveBeenCalled();
  });
});
