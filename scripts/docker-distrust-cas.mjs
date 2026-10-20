// Root CAs the server images must not trust, even while the base image or Node.js still ships
// them. Neither the system bundle nor Node's built-in store is checked against revocation lists,
// so dropping the root is the only way to stop trusting certificates that chain to it.
//
// Run as a script at build time, this strips them from the system bundle (used by faith, curl and
// other native TLS clients). Loaded with `--import` at runtime, it strips them from Node's default
// CA store (used by `fetch`, `https` and `tls`).
import { readFileSync, writeFileSync } from 'node:fs';
import { X509Certificate } from 'node:crypto';
import { getCACertificates, setDefaultCACertificates } from 'node:tls';

const DISTRUSTED_FINGERPRINTS = new Set([
  // emSign ECC Root CA - G3: the keys of intermediates under it are trivially recoverable
  // https://bugzilla.mozilla.org/show_bug.cgi?id=2083449
  '86:A1:EC:BA:08:9C:4A:8D:3B:BE:27:34:C6:12:BA:34:1D:81:3E:04:3C:F9:E8:A8:62:CD:5C:57:A3:6B:BE:6B',
]);

const SYSTEM_BUNDLE_PATH = '/etc/ssl/certs/ca-certificates.crt';
const PEM_PATTERN = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----\n?/g;

const isTrusted = pem => !DISTRUSTED_FINGERPRINTS.has(new X509Certificate(pem).fingerprint256);

if (import.meta.main) {
  const bundle = readFileSync(SYSTEM_BUNDLE_PATH, 'utf8');
  const certificates = bundle.match(PEM_PATTERN);
  const trustedCertificates = certificates.filter(isTrusted);
  writeFileSync(SYSTEM_BUNDLE_PATH, trustedCertificates.join(''));
  console.log(
    `Removed ${certificates.length - trustedCertificates.length} distrusted CA(s) from ${SYSTEM_BUNDLE_PATH}`,
  );
} else {
  setDefaultCACertificates(getCACertificates('default').filter(isTrusted));
}
