import { VdsNc as validateVdsNc } from '/vendor/validateVdsNc.js';
import { canonicalize } from '/vendor/jsonc.min.js';

export default function analyse(qrData) {
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
    checkVdsSignatureAgainstContents(json);
    results.push('✅ VDS-NC signature matches contents');
  } catch (e) {
    results.push('❌ VDS-NC signature does not match contents');
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

function checkVdsSignatureAgainstContents({ hdr, msg, sig: { cer, sigvl } }) {
  const certificate = base64UrlDecode(cer);
  const signature = base64UrlDecode(sigvl);
  const signedData = canonicalize({
    hdr,
    msg,
  });

  console.log(certificate);

}

export function base64UrlDecode(input) {
  return Uint8Array.from(atob(input.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}
