import { Command } from 'commander';

function run(
  folder: string,
  request: string,
) {
}

export default new Command('sign')
  .description('sign a Barcode Signer CSR')
  .argument('folder', 'path to CSCA folder')
  .argument('request', 'path to CSR file')
  .action(run);
