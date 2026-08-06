import { Readable } from 'node:stream';

import { resolveAssetImageData } from '../../src/utils/assets';

describe('resolveAssetImageData', () => {
  it('returns undefined when there is no asset', async () => {
    const openBlob = jest.fn();
    expect(await resolveAssetImageData(undefined, openBlob)).toBeUndefined();
    expect(openBlob).not.toHaveBeenCalled();
  });

  it('reads inline bytes from a legacy row without touching the blob store', async () => {
    const data = Buffer.from('legacy-bytes');
    const openBlob = jest.fn();
    expect(await resolveAssetImageData({ data, hash: null }, openBlob)).toEqual(data);
    expect(openBlob).not.toHaveBeenCalled();
  });

  it('resolves a hash row from the blob store, buffering the stream', async () => {
    const bytes = Buffer.from('blob-store-bytes');
    const openBlob = jest.fn(async () => Readable.from([bytes]));
    const result = await resolveAssetImageData({ hash: 'sha256:abc', data: null }, openBlob);
    expect(openBlob).toHaveBeenCalledWith('sha256:abc');
    expect(result).toEqual(bytes);
  });

  it('concatenates a multi-chunk blob stream', async () => {
    const openBlob = async () => Readable.from([Buffer.from('one-'), Buffer.from('two')]);
    expect(await resolveAssetImageData({ hash: 'sha256:abc' }, openBlob)).toEqual(
      Buffer.from('one-two'),
    );
  });

  it('propagates a blob store failure so the caller can present content-pending', async () => {
    const openBlob = async () => {
      throw new Error('not held locally');
    };
    await expect(resolveAssetImageData({ hash: 'sha256:abc' }, openBlob)).rejects.toThrow(
      'not held locally',
    );
  });
});
