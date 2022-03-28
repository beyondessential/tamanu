process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';

import { program } from 'commander';

import { version } from '../package.json';
import { create } from './commands';

async function run() {
  await program
    .version(version)
    .description('Tamanu CSCA Tooling')
    .addCommand(create)
    .parseAsync(process.argv);
}

run().catch(e => {
  console.error(`run(): fatal error: ${e.toString()}`);
  console.error(e.stack);
  process.exit(1);
})
