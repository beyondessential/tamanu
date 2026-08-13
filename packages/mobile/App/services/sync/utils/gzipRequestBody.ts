import { gzipSync, strToU8 } from 'fflate';

const compressThresholdBytes = 1024;

/**
 * Serialise and gzip a JSON request body, for upload with `Content-Encoding: gzip`.
 * Returns null for small bodies, which should be sent as plain JSON instead.
 */
export const gzipRequestBody = (body: unknown): Uint8Array | null => {
  const json = JSON.stringify(body);
  if (json.length < compressThresholdBytes) return null;

  const gzipped = gzipSync(strToU8(json));
  // axios sends the whole underlying ArrayBuffer of a typed-array body, so
  // make sure the view covers its buffer exactly
  return gzipped.byteLength === gzipped.buffer.byteLength ? gzipped : gzipped.slice();
};
