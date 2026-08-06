import { pipeline } from 'node:stream/promises';

// Resume-oriented subset of HTTP ranges: a single open-ended or closed range.
// Anything else is ignored and the full blob served, as RFC 9110 permits.
const RANGE_PATTERN = /^bytes=(?<start>\d+)-(?<end>\d*)$/;

// spec: SERVE
// Stream a stored blob over HTTP: range support for large files, the hash as a
// strong entity tag since it names immutable content, and a pipeline that
// destroys the source when either side terminates so a dropped download does not
// leak the open file handle. The caller supplies `open`, which returns the byte
// stream for a range — a facility passes its cache's read-through open, so a
// served blob is fetched on a local miss and counts as a use.
export async function serveBlob(req, res, { hash, size, contentType, open }) {
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
  res.setHeader('etag', `"${hash}"`);
  res.setHeader('accept-ranges', 'bytes');
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
