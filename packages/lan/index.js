// serverInfo must be imported before any shared modules
// so that it can set globals
import { version } from './app/serverInfo';

import { program } from 'commander';
import { log } from '@tamanu/shared/services/logging';

import {
  serveCommand,
  syncCommand,
  migrateCommand,
  reportCommand,
  migrateAppointmentsToLocationGroupsCommand,
} from './app/subCommands';

async function run() {
  program
    .version(version)
    .description('Tamanu lan-server')
    .name('node app.bundle.js');

  program.addCommand(serveCommand, { isDefault: true });
  program.addCommand(reportCommand);
  program.addCommand(syncCommand);
  program.addCommand(migrateCommand);
  program.addCommand(migrateAppointmentsToLocationGroupsCommand);

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
