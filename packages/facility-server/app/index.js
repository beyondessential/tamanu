// serverInfo must be imported before any shared modules
// so that it can set globals
import { version } from './serverInfo';

import { program } from 'commander';
import { log } from '@tamanu/shared/services/logging';

import {
  migrateAppointmentsToLocationGroupsCommand,
  migrateCommand,
  pushFacilityScopedSettingsCommand,
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
  program.addCommand(pushFacilityScopedSettingsCommand);

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
