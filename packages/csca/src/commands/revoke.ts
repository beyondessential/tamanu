import { parseDate } from 'chrono-node';
import { Command } from 'commander';

import CA from '../ca';
import Certificate from '../ca/Certificate';
import { confirm } from '../utils';

async function run(
  folder: string,
  certificate: string,
  options: { date: string; serial: boolean },
): Promise<void> {
  const date = parseDate(options.date);
  date.toISOString(); // throws on invalid date

  const ca = new CA(folder);
  await ca.openReadOnly();

  let serial: Buffer;
  if (options.serial) {
    const serialLen = certificate.length;
    serial = Buffer.from(
      certificate.padStart(serialLen % 2 === 0 ? serialLen : serialLen + 1, '0'),
      'hex',
    );
  } else {
    const cert = await Certificate.read(certificate);
    await cert.check(ca);
    serial = cert.serial;
  }

  const entry = await ca.readIndex(serial);
  if (entry.isRevoked) {
    console.log('Certificate was already revoked on', entry.revocationDate);
    return;
  }

  console.log('Certificate to be revoked:');
  console.log('Subject:', entry.subject);
  console.log('Issued:', entry.issuanceDate);
  console.log('Usable until:', entry.workingPeriodEnd);
  console.log('Valid until:', entry.validityPeriodEnd);

  if (options.date) {
    console.log('Proposed revocation date:', date);
  }

  await confirm('Are you sure you want to revoke this certificate?');

  await ca.openReadWrite();
  await ca.revokeCertificate(serial, date);
  console.log('Certificate revoked. Remember to upload the CRL!');
  await ca.archive();
}

export default new Command('revoke')
  .description('revoke a certificate')
  .argument('folder', 'path to CSCA folder')
  .argument('certificate', 'path to certificate file')
  .option('--serial', 'interpret the <certificate> input as a serial number in hex')
  .option('--date <datetime>', 'date and/or time of revocation', 'now')
  .action(run);

// CRL reason extension is explicitly disallowed by 9303-12
