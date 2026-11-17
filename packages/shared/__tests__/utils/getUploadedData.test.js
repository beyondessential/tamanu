import { Readable } from 'node:stream';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { InvalidParameterError } from '@tamanu/errors';

import { assertUploadedFilePath, getUploadedData } from '../../src/utils/getUploadedData';
import { tmpdirPath } from '../../src/utils/tmpdir';

// multiparty names what it writes with a random id and the original extension,
// so a unique extension finds this test's uploads and nothing else's.
const uploadsWithExtension = async extension => {
  const entries = await fs.readdir(tmpdirPath());
  return entries.filter(entry => entry.endsWith(extension));
};

const BOUNDARY = 'test-boundary';

const multipartRequest = parts => {
  const body = parts
    .map(({ name, filename, content }) =>
      [
        `--${BOUNDARY}`,
        `Content-Disposition: form-data; name="${name}"${filename ? `; filename="${filename}"` : ''}`,
        ...(filename ? ['Content-Type: text/plain'] : []),
        '',
        content,
      ].join('\r\n'),
    )
    .concat(`--${BOUNDARY}--`, '')
    .join('\r\n');
  const req = Readable.from([Buffer.from(body)]);
  req.headers = {
    'content-type': `multipart/form-data; boundary=${BOUNDARY}`,
    'content-length': String(Buffer.byteLength(body)),
  };
  return req;
};

const injected = {
  file: '/etc/passwd',
  fileName: 'passwd',
  fileContentType: 'text/plain',
  deleteFileAfterImport: true,
};

describe('getUploadedData', () => {
  it('drops file keys from a JSON body', async () => {
    const data = await getUploadedData({
      headers: { 'content-type': 'application/json' },
      body: { name: 'kept', ...injected },
    });
    expect(data).toEqual({ name: 'kept' });
  });

  it('drops file keys from multipart fields when no file is attached', async () => {
    const data = await getUploadedData(
      multipartRequest([
        { name: 'jsonData', content: JSON.stringify({ name: 'kept', ...injected }) },
        { name: 'file', content: '/etc/passwd' },
        { name: 'deleteFileAfterImport', content: 'true' },
      ]),
    );
    expect(data).toEqual({ name: 'kept' });
  });

  it('takes file keys from the uploaded file, not from jsonData', async () => {
    const data = await getUploadedData(
      multipartRequest([
        { name: 'jsonData', content: JSON.stringify({ name: 'kept', ...injected }) },
        { name: 'file', filename: 'upload.txt', content: 'hello' },
      ]),
    );
    try {
      expect(data).toMatchObject({
        name: 'kept',
        fileName: 'upload.txt',
        fileContentType: 'text/plain',
        deleteFileAfterImport: true,
      });
      expect(data.file).not.toBe(injected.file);
      expect(() => assertUploadedFilePath(data.file)).not.toThrow();
      expect(await fs.readFile(data.file, 'utf8')).toBe('hello');
    } finally {
      await fs.unlink(data.file);
    }
  });

  it('deletes what it wrote when jsonData cannot be parsed', async () => {
    const request = multipartRequest([
      { name: 'jsonData', content: '{ not json' },
      { name: 'file', filename: 'upload.w15malformed', content: 'hello' },
    ]);

    await expect(getUploadedData(request)).rejects.toThrow();
    expect(await uploadsWithExtension('.w15malformed')).toEqual([]);
  });

  it('deletes file parts it does not hand back', async () => {
    const data = await getUploadedData(
      multipartRequest([
        { name: 'file', filename: 'upload.w15kept', content: 'hello' },
        { name: 'spare', filename: 'upload.w15spare', content: 'nobody asked for this' },
      ]),
    );

    try {
      expect(await uploadsWithExtension('.w15spare')).toEqual([]);
      expect(await uploadsWithExtension('.w15kept')).toEqual([path.basename(data.file)]);
    } finally {
      await fs.unlink(data.file);
    }
  });
});

describe('assertUploadedFilePath', () => {
  it.each([
    ['an absolute path outside the temp directory', '/etc/passwd'],
    ['a path traversing out of the temp directory', path.join(os.tmpdir(), '..', 'etc', 'passwd')],
    ['a file in a subdirectory of the temp directory', path.join(os.tmpdir(), 'sub', 'file.txt')],
    ['a relative path', 'file.txt'],
    ['no path', undefined],
    ['a non-string value', ['/etc/passwd']],
  ])('rejects %s', (_, file) => {
    expect(() => assertUploadedFilePath(file)).toThrow(InvalidParameterError);
  });

  it('accepts a file directly in the temp directory', () => {
    expect(() => assertUploadedFilePath(path.join(os.tmpdir(), 'upload.txt'))).not.toThrow();
  });
});
