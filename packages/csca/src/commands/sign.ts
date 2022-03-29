import { Command } from 'commander';

const PROFILES = ['vds', 'eudcc'];

function run(
  folder: string,
  request: string,
  options: {
    profile: string;
  },
) {
  const { profile } = options;
  if (!PROFILES.includes(profile)) throw new Error('Invalid profile');
}

export default new Command('sign')
  .description('sign a Barcode Signer CSR')
  .argument('folder', 'path to CSCA folder')
  .argument('request', 'path to CSR file')
  .option(`-p, --profile [${PROFILES.join('|')}]`, 'profile to use', 'vds')
  .action(run);
