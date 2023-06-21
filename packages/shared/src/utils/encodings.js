/**
 * Encode DER data as a PEM document.
 * @param {Buffer} data DER data
 * @param {string} banner Uppercase string for the BEGIN/END banners
 * @returns {string} PEM document
 */
export function pem(data, banner) {
  return `-----BEGIN ${banner}-----\n${data
    .toString('base64')
    .match(/.{1,64}/g)
    .join('\n')}\n-----END ${banner}-----`;
}

/**
 * Decode a PEM document to a Buffer of DER data.
 * @param {string} pemString PEM document
 * @param {string} expectedBanner Uppercase string of the BEGIN/END banners
 * @returns {Buffer} DER data
 * @throws {Error} if the banners are not present or not correct
 */
export function depem(pemString, expectedBanner) {
  const text = pemString.trim();

  const beginRx = /^-{5}\s*BEGIN ?([^-]+)?-{5}\r?\n/;
  const endRx = /\r?\n-{5}\s*END ?([^-]+)?-{5}$/;

  const beginMatch = text.match(beginRx);
  if (!beginMatch || beginMatch[1] !== expectedBanner) {
    throw new Error(`Missing start banner on PEM, expected '-----BEGIN ${expectedBanner}-----'`);
  }

  const endMatch = text.match(endRx);
  if (!endMatch || endMatch[1] !== expectedBanner) {
    throw new Error(`Missing end banner on PEM, expected '-----END ${expectedBanner}-----'`);
  }

  return Buffer.from(text.replace(/^--.+/gm, ''), 'base64');
}

/**
 * Encode the input to Base64, the URL variant.
 * @param {string|Buffer|ArrayBuffer} input
 * @returns {string}
 */
export function base64UrlEncode(input) {
  // TODO: deprecate once we upgrade to Node v14!
  // see https://nodejs.org/dist/latest-v14.x/docs/api/buffer.html#buffer_buffers_and_character_encodings
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode the input string from Base64, the URL variant.
 * @param {string} input
 * @returns {Buffer}
 */
export function base64UrlDecode(input) {
  // TODO: deprecate once we upgrade to Node v14!
  // see https://nodejs.org/dist/latest-v14.x/docs/api/buffer.html#buffer_buffers_and_character_encodings
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Encodes Base64 string string to JSON.
 * @param {string} base64str
 * @returns {*} JSON
 */
export function jsonFromBase64(base64str) {
  return JSON.parse(Buffer.from(base64str, 'base64').toString('binary'));
}

/**
 * Creates a JSON object with the input and converts it to a Base64 string.
 * @param {object} obj
 * @returns {string} Base64 string
 */
export function jsonToBase64(obj) {
  return Buffer.from(JSON.stringify(obj), 'binary').toString('base64');
}
