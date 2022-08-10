// serverInfo must be imported before any shared modules
// so that it can set globals
import { version } from './app/serverInfo';

import { program } from 'commander';
import { log } from 'shared/services/logging';

import * as cmd from './app/subCommands';
import { setupEnv } from './app/env';

async function run() {
  program
    .version(version)
    .description('Tamanu sync-server')
    .name('node app.bundle.js');

  for (const [key, command] of Object.entries(cmd).filter(([key, _]) => /^\w+Command$/.test(key))) {
    program.addCommand(command, { isDefault: key === 'serveAllCommand' });
  }

  setupEnv();
  await program.parseAsync(process.argv);
}

// catch and exit if run() throws an error
(async () => {
  try {
    await run();
  } catch (e) {
    log.error(`run(): fatal error: ${e.toString()}`);
    log.error(e.stack);
    process.exit(1);
  }
})();
