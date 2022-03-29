import { Command } from 'commander';

function run(
  folder: string,
  options: {
    awsAccessKey?: string;
    awsAccessSecret?: string;
  },
) {
  let { awsAccessKey, awsAccessSecret } = options;
  if (!awsAccessKey) awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  if (!awsAccessSecret) awsAccessSecret = process.env.AWS_SECRET_ACCESS_KEY;
  if (!awsAccessKey) throw new Error('AWS_ACCESS_KEY_ID not set');
  if (!awsAccessSecret) throw new Error('AWS_SECRET_ACCESS_KEY not set');
}

export default new Command('crl-upload')
  .description('regenerate and upload the CRL')
  .argument('folder', 'path to CSCA folder')
  .option('-K, --aws-access-key', 'AWS access key id')
  .option('-S, --aws-access-secret', 'AWS access key secret')
  .action(run);
