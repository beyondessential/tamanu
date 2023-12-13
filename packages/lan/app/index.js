// serverInfo must be imported before any shared modules
// so that it can set globals
// eslint-disable-next-line import/order
import { version } from './serverInfo';

import { log } from '@tamanu/shared/services/logging';
import { program } from 'commander';

import {
  migrateAppointmentsToLocationGroupsCommand,
  migrateCommand,
  reportCommand,
  serveCommand,
  syncCommand,
} from './subCommands';

async function run() {
  program
    .version(version)
    .description('Tamanu Facility server')
    .name('node dist');

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
