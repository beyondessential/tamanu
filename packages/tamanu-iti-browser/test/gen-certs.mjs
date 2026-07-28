import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Generate a test PKI with the system openssl:
//   - a BES CA (the anchor baked into the browser)
//   - a "rogue" CA (stands in for a public CA / attacker)
//   - good leaf:   signed by BES CA, SAN = facility identity        -> must be trusted
//   - badSan leaf: signed by BES CA, SAN = a different facility      -> must be rejected
//   - badCa leaf:  signed by the rogue CA, SAN = facility identity   -> must be rejected
const FACILITY_ID = '11111111-2222-3333-4444-555555555555';
const HOST = `${FACILITY_ID}.facility.internal`;

function openssl(args, cwd) {
  execFileSync('openssl', args, { cwd, stdio: ['ignore', 'ignore', 'pipe'] });
}

function makeCa(dir, name) {
  const key = path.join(dir, `${name}.key`);
  const crt = path.join(dir, `${name}.crt`);
  openssl(
    ['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256', '-nodes',
      '-keyout', key, '-out', crt, '-days', '3650', '-subj', `/CN=${name}`],
    dir,
  );
  return { key, crt };
}

function makeLeaf(dir, name, san, ca) {
  const key = path.join(dir, `${name}.key`);
  const csr = path.join(dir, `${name}.csr`);
  const crt = path.join(dir, `${name}.crt`);
  openssl(
    ['req', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256', '-nodes',
      '-keyout', key, '-out', csr, '-subj', `/CN=${san}`, '-addext', `subjectAltName=DNS:${san}`],
    dir,
  );
  openssl(
    ['x509', '-req', '-in', csr, '-CA', ca.crt, '-CAkey', ca.key, '-days', '180',
      '-copy_extensions', 'copy', '-out', crt],
    dir,
  );
  return { key: fs.readFileSync(key), cert: fs.readFileSync(crt) };
}

export function generateCerts(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const besCa = makeCa(dir, 'bes-ca');
  const rogueCa = makeCa(dir, 'rogue-ca');
  return {
    facilityId: FACILITY_ID,
    host: HOST,
    besCaPem: fs.readFileSync(besCa.crt),
    good: makeLeaf(dir, 'good', HOST, besCa),
    badSan: makeLeaf(dir, 'badsan', 'someone-else.facility.internal', besCa),
    badCa: makeLeaf(dir, 'badca', HOST, rogueCa),
  };
}
