process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';

import { program } from 'commander';
import { log } from 'shared/services/logging';

import { version } from '../package.json';
import { csca } from './commands';

async function run() {
  await program
    .version(version)
    .description('Tamanu CSCA Tooling')
    .addCommand(csca)
    .parseAsync(process.argv);
}

run().catch(e => {
  log.error(`run(): fatal error: ${e.toString()}`);
  log.error(e.stack);
  process.exit(1);
})
