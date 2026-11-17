import { Readable } from 'node:stream';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { InvalidParameterError } from '@tamanu/errors';

import { assertUploadedFilePath, getUploadedData } from '../../src/utils/getUploadedData';
import { uploadDir, uploadDirPath } from '../../src/utils/tmpdir';

// multiparty names what it writes with a random id and the original extension,
// so an extension unique to this run finds its uploads and nothing else's,
// including anything an earlier run left behind. It keeps only the first 16
// characters of an extension, so the whole thing has to stay shorter than that.
const RUN_ID = Math.random().toString(36).slice(2, 8);
const extensionFor = name => `.${name}${RUN_ID}`;
const uploadsWithExtension = async extension => {
  const entries = await fs.readdir(await uploadDir());
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
      { name: 'file', filename: `upload${extensionFor('malformed')}`, content: 'hello' },
    ]);

    await expect(getUploadedData(request)).rejects.toThrow();
    expect(await uploadsWithExtension(extensionFor('malformed'))).toEqual([]);
  });

  it('deletes file parts it does not hand back', async () => {
    const data = await getUploadedData(
      multipartRequest([
        { name: 'file', filename: `upload${extensionFor('kept')}`, content: 'hello' },
        {
          name: 'spare',
          filename: `upload${extensionFor('spare')}`,
          content: 'nobody asked for this',
        },
      ]),
    );

    try {
      expect(await uploadsWithExtension(extensionFor('spare'))).toEqual([]);
      expect(await uploadsWithExtension(extensionFor('kept'))).toEqual([path.basename(data.file)]);
    } finally {
      await fs.unlink(data.file);
    }
  });
});

describe('uploadDir', () => {
  it('is a directory of our own, not the system temp directory everyone shares', async () => {
    const directory = await uploadDir();
    expect(path.dirname(directory)).toBe(path.resolve(os.tmpdir()));
    expect(directory).not.toBe(path.resolve(os.tmpdir()));
  });

  // windows does not carry these permission bits
  it.skipIf(process.platform === 'win32')('is readable only by this user', async () => {
    const { mode } = await fs.stat(await uploadDir());
    expect(mode & 0o777).toBe(0o700);
  });
});

describe('assertUploadedFilePath', () => {
  // the upload directory is only made once something has been uploaded, and
  // until then no path at all is one of ours
  beforeAll(() => uploadDir());

  it.each([
    ['an absolute path outside the upload directory', () => '/etc/passwd'],
    [
      'a file in the system temp directory the upload directory sits in',
      () => path.join(os.tmpdir(), 'upload.txt'),
    ],
    [
      'a path traversing out of the upload directory',
      () => path.join(uploadDirPath(), '..', 'etc', 'passwd'),
    ],
    [
      'a file in a subdirectory of the upload directory',
      () => path.join(uploadDirPath(), 'sub', 'file.txt'),
    ],
    ['a relative path', () => 'file.txt'],
    ['no path', () => undefined],
    ['a non-string value', () => ['/etc/passwd']],
  ])('rejects %s', (_, file) => {
    expect(() => assertUploadedFilePath(file())).toThrow(InvalidParameterError);
  });

  it('accepts a file directly in the upload directory', () => {
    expect(() => assertUploadedFilePath(path.join(uploadDirPath(), 'upload.txt'))).not.toThrow();
  });
});
