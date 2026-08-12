import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable, Writable } from 'node:stream';

import { MAX_INLINE_BLOB_BYTES } from '@tamanu/constants';

import { readBlobAsBase64, serveBlob } from '../../src/utils/serveBlob';

class FakeResponse extends Writable {
  statusCode = 200;
  headers = {};
  onWrite = () => {};
  #chunks = [];

  status(code) {
    this.statusCode = code;
    return this;
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
    return this;
  }

  _write(chunk, _encoding, callback) {
    this.#chunks.push(chunk);
    callback();
    this.onWrite();
  }

  get body() {
    return Buffer.concat(this.#chunks);
  }
}

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

// spec: SERVE
describe('serveBlob', () => {
  const CONTENT = Buffer.from('bytes named by their hash', 'utf8');
  const HASH = 'sha256:abc123';
  const ETAG = `"${HASH}"`;

  const serve = async ({ hash = HASH, headers = {} } = {}) => {
    const res = new FakeResponse();
    const open = ({ start, end }) =>
      Readable.from([start === undefined ? CONTENT : CONTENT.subarray(start, end + 1)]);
    await serveBlob({ headers }, res, {
      hash,
      size: CONTENT.length,
      contentType: 'text/plain',
      open,
    });
    return res;
  };

  it('carries the hash as a strong validator and lets the client keep it indefinitely', async () => {
    const res = await serve();
    expect(res.statusCode).toBe(200);
    expect(res.headers.etag).toBe(ETAG);
    expect(res.headers['cache-control']).toBe('private, max-age=31536000, immutable');
    expect(res.body).toEqual(CONTENT);
  });

  // A shared cache holding clinical content would outlive the permission check
  // that released it, so the directive has to stay private.
  it('does not let a shared cache keep a copy', async () => {
    const res = await serve();
    expect(res.headers['cache-control']).not.toMatch(/public/);
  });

  it('sends no bytes to a client that already holds the content', async () => {
    const res = await serve({ headers: { 'if-none-match': ETAG } });
    expect(res.statusCode).toBe(304);
    expect(res.headers.etag).toBe(ETAG);
    expect(res.body).toHaveLength(0);
  });

  // A cache updates its stored entry from the headers a 304 carries, so leaving
  // freshness off it means a client that cached before this existed revalidates
  // on every read forever.
  it('repeats the freshness a 200 would carry on the 304', async () => {
    const served = await serve();
    const notModified = await serve({ headers: { 'if-none-match': ETAG } });
    expect(notModified.headers['cache-control']).toBe(served.headers['cache-control']);
  });

  it('matches a weak validator and one among several', async () => {
    expect((await serve({ headers: { 'if-none-match': `W/${ETAG}` } })).statusCode).toBe(304);
    expect((await serve({ headers: { 'if-none-match': `"other", ${ETAG}` } })).statusCode).toBe(304);
    expect((await serve({ headers: { 'if-none-match': '*' } })).statusCode).toBe(304);
  });

  it('serves the content when the client holds a different one', async () => {
    const res = await serve({ headers: { 'if-none-match': '"sha256:stale"' } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(CONTENT);
  });

  // spec: BKFL — a row the backfill has not reached has no content hash, so there
  // is nothing to validate against, but everything else matches the moved form.
  it('serves content with no hash without a validator, and still supports ranges', async () => {
    const res = await serve({ hash: null });
    expect(res.statusCode).toBe(200);
    expect(res.headers.etag).toBeUndefined();
    expect(res.headers['cache-control']).toBeUndefined();
    expect(res.headers['accept-ranges']).toBe('bytes');

    const ranged = await serve({ hash: null, headers: { range: 'bytes=6-10' } });
    expect(ranged.statusCode).toBe(206);
    expect(ranged.headers['content-range']).toBe(`bytes 6-10/${CONTENT.length}`);
    expect(ranged.body).toEqual(CONTENT.subarray(6, 11));
  });

  it('never answers 304 for content with no validator, whatever the client sends', async () => {
    const res = await serve({ hash: null, headers: { 'if-none-match': '*' } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(CONTENT);
  });

  it('writes the first bytes out before the source has produced its last', async () => {
    const res = new FakeResponse();
    let sourceFinished = false;
    let finishedAtFirstWrite = null;
    let release;
    const released = new Promise(resolve => {
      release = resolve;
    });
    // Released on the first write, or shortly after regardless, so a serve that
    // reads the whole blob before writing any of it fails the assertion below
    // rather than waiting on a write that is never coming.
    const fallback = setTimeout(() => release(), 100);
    res.onWrite = () => {
      finishedAtFirstWrite ??= sourceFinished;
      release();
    };

    async function* slowly() {
      yield CONTENT.subarray(0, 5);
      await released;
      sourceFinished = true;
      yield CONTENT.subarray(5);
    }

    try {
      await serveBlob({ headers: {} }, res, {
        hash: HASH,
        size: CONTENT.length,
        contentType: 'text/plain',
        open: () => Readable.from(slowly()),
      });
    } finally {
      clearTimeout(fallback);
    }

    expect(finishedAtFirstWrite).toBe(false);
    expect(res.body).toEqual(CONTENT);
  });

  describe('a client that goes away mid-download', () => {
    let root;
    let filePath;

    beforeAll(async () => {
      root = await fs.mkdtemp(path.join(os.tmpdir(), 'serve-blob-'));
      filePath = path.join(root, 'content');
      // Past the read stream's buffer, so the download is still in flight when
      // the client disconnects.
      await fs.writeFile(filePath, Buffer.alloc(256 * 1024, 'a'));
    });

    afterAll(async () => {
      await fs.rm(root, { recursive: true, force: true });
    });

    // How an interrupted fetch pauses before resuming with a range request, so
    // it must not surface as a failure, and it must not leave the file open.
    it('is not an error, and leaves no open file handle', async () => {
      const res = new FakeResponse();
      res.onWrite = () => res.destroy();
      const source = createReadStream(filePath);
      const closed = new Promise(resolve => {
        source.once('close', resolve);
      });

      await expect(
        serveBlob({ headers: {} }, res, {
          hash: HASH,
          size: 256 * 1024,
          contentType: 'text/plain',
          open: () => source,
        }),
      ).resolves.toBeUndefined();

      await closed;
      expect(source.closed).toBe(true);
    });
  });
});
