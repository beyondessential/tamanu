import { Command } from 'commander';

import CA from '../ca';
import { confirm } from '../utils';

async function run(
  folder: string,
  options: {
    awsAccessKey?: string;
    awsAccessSecret?: string;
  },
): Promise<void> {
  let { awsAccessKey, awsAccessSecret } = options;
  if (!awsAccessKey) awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  if (!awsAccessSecret) awsAccessSecret = process.env.AWS_SECRET_ACCESS_KEY;
  if (!awsAccessKey) throw new Error('AWS_ACCESS_KEY_ID not set');
  if (!awsAccessSecret) throw new Error('AWS_SECRET_ACCESS_KEY not set');

  const ca = new CA(folder);
  await ca.openReadOnly();

  const revoked = await ca.revokedCertificates();
  if (revoked.length === 0) {
    console.log('No revoked certificates, will generate an empty CRL');
  } else {
    console.log(`${revoked.length} revoked certificates:`);
    for (const cert of revoked) {
      console.log('\n');
      console.log(cert.serial.toString('hex'));
      console.log('Subject:', cert.subject);
      console.log('Issued:', cert.issuanceDate);
      console.log('Was usable until:', cert.workingPeriodEnd);
      console.log('Was valid until:', cert.validityPeriodEnd);
      console.log('Revoked:', cert.revocationDate);
    }
  }
  console.log('\n');

  // TODO: as optimisation, could read existing CRL and only regenerate if:
  // - expiry is less than a week away (or prompt?)
  // - list of revoked certs has changed

  await confirm('Generate CRL and upload?');

  await ca.openReadWrite();

  const crl = await ca.generateCrl();
  console.log('Generated CRL number:', (await crl.serial()).toString('hex'));

  await ca.uploadCrl({ accessKeyId: awsAccessKey, secretAccessKey: awsAccessSecret });
  await ca.archive();
}

export default new Command('crl-upload')
  .description('regenerate and upload the CRL')
  .argument('folder', 'path to CSCA folder')
  .option('-K, --aws-access-key', 'AWS access key id')
  .option('-S, --aws-access-secret', 'AWS access key secret')
  .action(run);
