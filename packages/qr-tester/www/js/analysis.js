import { VdsNc as validateVdsNc } from '/vendor/validateVdsNc.js';
import { canonicalize } from '/vendor/jsonc.min.js';

export default async function analyse(qrData) {
  const results = [];

  let json;
  try {
    json = checkJson(qrData);
    results.push('✅ Data is JSON');
  } catch (e) {
    return [e];
  }

  if (validateVdsNc(json)) {
    results.push('✅ JSON is a valid VDS-NC schema');
  } else {
    results.push(`❌ JSON is not a valid VDS-NC schema`);
    for (const error of validateVdsNc.errors) {
      results.push(`❌ Schema error: ${error.message} (at ${error.instancePath})`);
    }
  }

  try {
    parseCertificate(json.sig.cer);
    // TODO: check fields
    results.push('✅ VDS-NC embedded certificate is well-formed');
  } catch (e) {
    results.push(`❌ VDS-NC embedded certificate parse error: ${e}`);
  }

  try {
    await checkVdsSignatureAgainstContents(json);
    results.push('✅ VDS-NC signature matches contents');
  } catch (e) {
    results.push(`❌ VDS-NC signature does not match contents: ${e}`);
  }

  return results;
}

function checkJson(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    throw `❌ Data is not JSON: ${e}`;
  }
}

function parseCertificate(cer) {
  const certificate = base64UrlDecode(cer);
  const x509 = new X509();
  x509.readCertHex(toHex(certificate));
  return x509;
}

async function checkVdsSignatureAgainstContents({ data, sig: { cer, sigvl } }) {
  const signature = base64UrlDecode(sigvl);
  const signedData = canonicalize(data);

  const publicKey = await crypto.subtle.importKey(
    'spki',
    fromHex(parseCertificate(cer).getSPKI()),
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify'],
  );

  if (
    !(await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: {
          name: 'SHA-256',
        },
      },
      publicKey,
      signature,
      Uint8Array.from(signedData, c => c.charCodeAt(0)),
    ))
  ) {
    throw new Error('Signature does not match contents');
  }
}

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

function base64UrlDecode(input) {
  return Uint8Array.from(atob(base64UrlToPlain(input)), c => c.charCodeAt(0));
}

const hexbet = '0123456789abcdef';
const lookup = new Array(256);
for (let i = 0; i < 256; i++) {
  lookup[i] = `${hexbet[(i >>> 4) & 0xf]}${hexbet[i & 0xf]}`;
}
function toHex(array) {
  let hex = '';
  for (let i = 0, l = array.length; i < l; i++) {
    hex += lookup[array[i]];
  }
  return hex;
}
function fromHex(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}
