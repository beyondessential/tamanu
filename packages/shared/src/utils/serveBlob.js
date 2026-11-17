import { pipeline } from 'node:stream/promises';

import { MAX_INLINE_BLOB_BYTES } from '@tamanu/constants';
import { InvalidParameterError } from '@tamanu/errors';

// A single open-ended or closed range; anything else serves the full blob, as RFC 9110 permits.
const RANGE_PATTERN = /^bytes=(?<start>\d+)-(?<end>\d*)$/;

// spec: SERVE
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
// Weak comparison per RFC 9110, so a `W/` prefix still matches.
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

// spec: SERVE
// Private: blob content is clinical data, so a shared cache must not keep a copy.
const IMMUTABLE = 'private, max-age=31536000, immutable';

export async function serveBlob(req, res, { hash, size, contentType, open }) {
  const etag = hash ? `"${hash}"` : null;

  if (clientHoldsContent(req, etag)) {
    // Carries the freshness a 200 would, or a client that cached earlier revalidates on every read
    // forever.
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
    // Routine: an interrupted fetch pauses this way before resuming with a range request.
    if (error?.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      throw error;
    }
  }
}
