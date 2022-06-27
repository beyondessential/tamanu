function base64UrlToPlain(input) {
  // Replace non-url compatible chars with base64 standard chars
  input = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/=+$/, '');

  // Pad out with standard base64 required padding characters
  var pad = input.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error(
        'InvalidLengthError: Input base64url string is the wrong length to determine padding',
      );
    }
    input += new Array(5 - pad).join('=');
  }

  return input;
}

export function base64Decode(input) {
  return Uint8Array.from(atob(input), c => c.charCodeAt(0));
}

export function base64UrlDecode(input) {
  return base64Decode(base64UrlToPlain(input));
}

const hexbet = '0123456789abcdef';
const lookup = new Array(256);
for (let i = 0; i < 256; i++) {
  lookup[i] = `${hexbet[(i >>> 4) & 0xf]}${hexbet[i & 0xf]}`;
}
export function toHex(array) {
  let hex = '';
  for (let i = 0, l = array.length; i < l; i++) {
    hex += lookup[array[i]];
  }
  return hex;
}
export function fromHex(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

export function ec256PublicKey(keydata) {
  return crypto.subtle.importKey(
    'spki',
    keydata,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify'],
  );
}
