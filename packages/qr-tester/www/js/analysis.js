import { canonicalize } from '/vendor/jsonc.min.js';
import { VdsNc as validateVdsNc } from '/vendor/validateVdsNc.js';
import { base64UrlDecode, ec256PublicKey, fromHex, toHex } from './encodings.js';

import devCsca from './csca/dev.js';
import mlCsca, { HEALTH_ML, MAIN_ML } from './csca/masterlist.js';
import nauruCsca from './csca/nauru.js';
import urlCsca from './csca/url.js';

export default async function analyse(qrData, csca) {
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
    // TODO: nice to have: validating things like:
    // - the format of the country and common name fields, which is very particular for ICAO
    // - the certificate "not before/after" dates, making sure that it's valid for this issuance
    // - the very specific ICAO metadata bits like key usage
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

  try {
    await checkVdsCertificateAgainstCsca(json, csca);
    results.push('✅ VDS-NC certificate is valid');
  } catch (e) {
    results.push(`❌ VDS-NC certificate does not belong to CSCA: ${e}`);
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

  const publicKey = await ec256PublicKey(fromHex(parseCertificate(cer).getSPKI()));

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

async function checkVdsCertificateAgainstCsca({ sig: { cer } }, cscaName) {
  const certificate = parseCertificate(cer);

  let cscaPubKeys = [];
  switch (cscaName) {
    case 'bes_dev':
      cscaPubKeys = await devCsca();
      break;

    case 'nauru':
      cscaPubKeys = await nauruCsca();
      break;

    case 'from_url': {
      const url = document.querySelector('#csca_cert_url input').value;
      cscaPubKeys = await urlCsca(url);
      break;
    }

    case 'from_file': {
      const url = URL.createObjectURL(document.querySelector('#csca_cert_file input').files[0]);
      cscaPubKeys = await urlCsca(url);
      break;
    }

    case 'icao_ml':
      cscaPubKeys = await mlCsca(MAIN_ML);
      break;

    case 'icao_health_ml':
      cscaPubKeys = await mlCsca(HEALTH_ML);
      break;

    default:
      throw new Error(`Unknown or unsupported CSCA "${cscaName}"`);
  }

  for (const [n, key] of cscaPubKeys.entries()) {
    try {
      if (certificate.verifySignature(key)) {
        return true;
      }
    } catch (e) {
      console.warn(`Signature incompatibility on key ${n}, ignoring: ${e}`);
    }
  }

  throw new Error('no public key matched the signature');
}
