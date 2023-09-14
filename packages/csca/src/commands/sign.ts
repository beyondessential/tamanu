import { promises as fs } from 'fs';
import { extname } from 'path';

import CA from '../ca';
import crypto from '../crypto';
import { confirm } from '../utils';
import { Pkcs10CertificateRequest } from '@peculiar/x509';
import { Command } from 'commander';

async function run(folder: string, request: string): Promise<void> {
  const requestFile = await fs.readFile(request);
  const csr = new Pkcs10CertificateRequest(requestFile);

  if (!(await csr.verify(crypto as Crypto)))
    throw new Error('CSR has been tampered with: signature is invalid');

  console.log('request subject:', csr.subject);
  console.log('request signature is valid');

  const ca = new CA(folder);
  await ca.openReadOnly(); // checks integrity

  await confirm('Proceed?');

  await ca.openReadWrite();
  const cert = await ca.issueFromRequest(csr);

  const destPath = request.replace(new RegExp(`${extname(request).replace('.', '\\.')}$`), '.crt');
  console.log('writing certificate to', destPath);
  await cert.write(destPath);

  await ca.archive();
}

export default new Command('sign')
  .description('sign a Barcode Signer CSR')
  .argument('folder', 'path to CSCA folder')
  .argument('request', 'path to CSR file')
  .action(run);
