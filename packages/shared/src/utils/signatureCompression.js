/*
 * - survey_response_answers.body for Signature questions is a JSON array of points, representing
 *   centrelines of the strokes in the signature.
 *   e.g.`[[240,75],[242,76],[245,80]]`
 * - survey_response_answers.body is TEXT column, which has huge limit (64 KiB), but table has btree
 *   version 4 index, which constrains the entire index record size to 2704 B.
 * - Uncompressed, a very complex signature may exceed 8 KiB, so we apply compression. (Gzip for
 *   compression; encoded as Base64 for TEXT column.)
 * - Uncompressed Signature data not meaningful to query on anyway.
 *
 * Based on https://gist.github.com/Explosion-Scratch/357c2eebd8254f8ea5548b0e6ac7a61b
 */

/**
 * @typedef {`[[${string}]]` | ''} SignatureAnswerBody JSON string encoding an array of strokes.
 * Each stroke is an array of points defining the centreline of the stroke.
 */

/** @satisfies {CompressionFormat} */
const encoding = /** @type {const} */ ('gzip');

/**
 * @param {SignatureAnswerBody | null | undefined} body
 * @returns {Promise<string>} `body`, Gzip-compressed then encoded in Base64
 */
export async function compressSignatureBody(body) {
  if (!body) return '';

  const byteArray = new TextEncoder().encode(body);
  const cs = new CompressionStream(encoding);
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const buffer = await new Response(cs.readable).arrayBuffer();

  return typeof Uint8Array.prototype.toBase64 === 'function'
    ? new Uint8Array(buffer).toBase64() // Requires Node 25+. Fine in supported Chromium versions.
    : Buffer.from(buffer).toString('base64');
}

/**
 * @param {string | null | undefined} base64String
 * @returns {Promise<SignatureAnswerBody>}
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
 * Used in frontend only for form validation to flag extremely complex signatures that may exceed
 * database index size limit.
 * @param {SignatureAnswerBody | null | undefined} body
 * @returns {Promise<number>} Length of compressed `body`
 */
export async function estimateCompressedSize(body) {
  return (await compressSignatureBody(body)).length;
}
