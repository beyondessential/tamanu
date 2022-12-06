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
  const { args } = await program.parseAsync(process.argv);
  if (args[0] && !args[0].match(/^serve/i)) {
    // Fast exit for commands that aren't running a server
    process.exit(0);
  }
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
