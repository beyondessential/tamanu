/*
 * - survey_response_answers.body for Signature questions is a JSON array of points, representing
 *   centrelines of the strokes in the signature.
 *   e.g.`[[240,75],[242,76],[245,80]]`
 * - survey_response_answers.body is TEXT column, which has huge limit (64 KiB), but table has index
 *   on the column, which constrains it to 8 KiB.
 * - Uncompressed, a very complex signature may exceed 8 KiB, so we apply compression. (Gzip for
 *   compression; encoded as Base64 for TEXT column.)
 * - Uncompressed Signature data not meaningful to query on anyway.
 *
 * Based on https://gist.github.com/Explosion-Scratch/357c2eebd8254f8ea5548b0e6ac7a61b
 */

/** @satisfies {CompressionFormat} */
const encoding = /** @type {const} */ ('gzip');

/**
 * @param {'' | `[${string}]`} body Centreline JSON stored in survey_response_answers.body when uncompressed.
 * @returns {Promise<string>} gzip-compressed base64 string for database storage.
 */
export async function compressSignatureBody(body) {
  if (!body) return '';

  const byteArray = new TextEncoder().encode(body);
  const cs = new CompressionStream(encoding);
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const buffer = await new Response(cs.readable).arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

/**
 * @param {string} base64String gzip-compressed base64 from survey_response_answers.body.
 * @returns {Promise<'' | `[${string}]`>} centreline JSON
 */
export async function decompressSignatureBody(base64String) {
  if (!base64String) return '';

  const byteArray = new Uint8Array(Buffer.from(base64String, 'base64'));
  const cs = new DecompressionStream(encoding);
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const arrayBuffer = await new Response(cs.readable).arrayBuffer();
  return new TextDecoder().decode(arrayBuffer);
}

/**
 * @param {string | null | undefined} body
 * @returns {body is `[${string}]`}
 */
export function isUncompressedSignatureBody(body) {
  if (!body || !body.startsWith('[') || !body.endsWith(']')) return false;
  try {
    void JSON.parse(body);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Compresses centreline JSON for database storage. Passes through empty and already-compressed values.
 * @param {string | null | undefined} body
 */
export async function prepareSignatureBodyForStorage(body) {
  if (!body || !isUncompressedSignatureBody(body)) return body ?? '';
  return compressSignatureBody(body);
}

/**
 * Decompresses a stored signature body for API responses. Passes through empty and plain JSON.
 * @param {string | null | undefined} body
 */
export async function prepareSignatureBodyForApi(body) {
  if (!body || isUncompressedSignatureBody(body)) return body ?? '';
  return decompressSignatureBody(body);
}
