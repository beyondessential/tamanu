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
  if (
    !text.startsWith(`-----BEGIN ${expectedBanner}-----\n`) ||
    !text.endsWith(`\n-----END ${expectedBanner}-----`)
  ) {
    throw new Error('Must be in PEM format with banners');
  }

  return Buffer.from(text.replace(/^--.+/gm, ''), 'base64');
}

/**
 * Encode the input to Base64, the URL variant.
 * @param {string|Buffer|ArrayBuffer} input
 * @returns {string}
 */
export function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decode the input string from Base64, the URL variant.
 * @param {string} input
 * @returns {Buffer}
 */
export function base64UrlDecode(input) {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}
