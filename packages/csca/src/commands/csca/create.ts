import { Command } from 'commander';

import { log } from 'shared/services/logging';

function run () {}

export default new Command('create')
  .description('creates a new CSCA')
  .requiredOption('-s, --signer-certificate <path>', 'Path to the signer certificate')
  .action(run);
