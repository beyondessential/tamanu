/* Based on https://gist.github.com/Explosion-Scratch/357c2eebd8254f8ea5548b0e6ac7a61b */

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
