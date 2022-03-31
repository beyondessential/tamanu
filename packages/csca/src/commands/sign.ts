import { promises as fs } from 'fs';
import { extname } from 'path';

import CA from '../ca';
import { Command } from 'commander';
import crypto from '../crypto';
import { Pkcs10CertificateRequest } from '@peculiar/x509';
import { confirm } from '../utils';

async function run(folder: string, request: string) {
  const requestFile = await fs.readFile(request);
  const csr = new Pkcs10CertificateRequest(requestFile);

  if (!(await csr.verify(crypto)))
    throw new Error('CSR has been tampered with: signature is invalid');

  console.log('request subject:', csr.subject);
  console.log('request signature is valid');

  await confirm('Proceed?');

  const ca = new CA(folder);
  const cert = await ca.issueFromRequest(csr);

  const destPath = request.replace(new RegExp(extname(request).replace('.', '\\.') + '$'), '.crt');
  console.log('writing certificate to', destPath);
  await cert.write(destPath);
}

export default new Command('sign')
  .description('sign a Barcode Signer CSR')
  .argument('folder', 'path to CSCA folder')
  .argument('request', 'path to CSR file')
  .action(run);
