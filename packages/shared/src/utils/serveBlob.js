import { pipeline } from 'node:stream/promises';

import { MAX_INLINE_BLOB_BYTES } from '@tamanu/constants';
import { InvalidParameterError } from '@tamanu/errors';

// Resume-oriented subset of HTTP ranges: a single open-ended or closed range.
// Anything else is ignored and the full blob served, as RFC 9110 permits.
const RANGE_PATTERN = /^bytes=(?<start>\d+)-(?<end>\d*)$/;

// spec: SERVE
// Read a stored blob into a base64 string for a caller that consumes the content
// inline. The whole blob and its encoding are held in memory at once, so content
// past the inline limit is refused rather than served this way.
export async function readBlobAsBase64({ size, open }) {
  if (size > MAX_INLINE_BLOB_BYTES) {
    throw new InvalidParameterError(
      `Content of ${size} bytes is too large to encode inline; request it without base64 to stream it.`,
    );
  }
  const chunks = [];
  for await (const chunk of await open({})) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('base64');
}

// spec: SERVE
// spec: SERVE
// Whether the client already holds this content. Weak comparison per RFC 9110,
// which is what If-None-Match takes, so a `W/` prefix still matches.
function clientHoldsContent(req, etag) {
  const header = req.headers['if-none-match'];
  if (!etag || !header) {
    return false;
  }
  if (header.trim() === '*') {
    return true;
  }
  return header.split(',').some(candidate => candidate.trim().replace(/^W\//, '') === etag);
}

// Stream a stored blob over HTTP: range support for large files, the hash as a
// strong entity tag since it names immutable content, and a pipeline that
// destroys the source when either side terminates so a dropped download does not
// leak the open file handle. The caller supplies `open`, which returns the byte
// stream for a range, and a facility passes its cache's read-through open, so a
// served blob is fetched on a local miss and counts as a use.
//
// A legacy attachment, whose bytes are still in its database row, has no content
// hash and so nothing to validate against. It passes no `hash` and is served
// without a validator, but with everything else the same (see backfill.md).
// spec: SERVE
// A hash names immutable content, so a client holding it never needs the bytes
// again. Private, since blob content is clinical data and a shared cache must not
// keep a copy.
const IMMUTABLE = 'private, max-age=31536000, immutable';

export async function serveBlob(req, res, { hash, size, contentType, open }) {
  const etag = hash ? `"${hash}"` : null;

  if (clientHoldsContent(req, etag)) {
    // Carries the freshness a 200 would: a cache updates its stored entry from
    // the headers the 304 arrives with, so omitting it leaves a client that
    // cached before this existed revalidating on every read forever.
    res.status(304).setHeader('etag', etag).setHeader('cache-control', IMMUTABLE).end();
    return;
  }

  const range = req.headers.range?.match(RANGE_PATTERN)?.groups;
  let start;
  let end;
  if (range) {
    start = parseInt(range.start, 10);
    end = range.end === '' ? size - 1 : parseInt(range.end, 10);
    if (start >= size || end >= size || start > end) {
      res.status(416).setHeader('content-range', `bytes */${size}`);
      res.end();
      return;
    }
  }

  const stream = await open(range ? { start, end } : {});
  res.status(range ? 206 : 200);
  res.setHeader('content-type', contentType ?? 'application/octet-stream');
  res.setHeader('content-length', range ? end - start + 1 : size);
  res.setHeader('accept-ranges', 'bytes');
  if (etag) {
    res.setHeader('etag', etag);
    res.setHeader('cache-control', IMMUTABLE);
  }
  if (range) {
    res.setHeader('content-range', `bytes ${start}-${end}/${size}`);
  }
  try {
    await pipeline(stream, res);
  } catch (error) {
    // A client going away mid-download is routine: it is how an interrupted
    // fetch pauses before resuming with a range request.
    if (error?.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      throw error;
    }
  }
}
