// serverInfo must be imported before any shared modules
// so that it can set globals
import { version } from './serverInfo';

import { program } from 'commander';
import { log } from '@tamanu/shared/services/logging';

import {
  configSecretCommand,
  migrateAppointmentsToLocationGroupsCommand,
  migrateCommand,
  reportCommand,
  shellCommand,
  startAllCommand,
  startApiCommand,
  startSyncCommand,
  startTasksCommand,
  syncCommand,
  upgradeCommand,
} from './subCommands';

async function run() {
  program.version(version).description('Tamanu Facility server').name('node dist');

  program.addCommand(startAllCommand, { isDefault: true });
  program.addCommand(startApiCommand);
  program.addCommand(startSyncCommand);
  program.addCommand(startTasksCommand);
  program.addCommand(reportCommand);
  program.addCommand(syncCommand);
  program.addCommand(migrateCommand);
  program.addCommand(migrateAppointmentsToLocationGroupsCommand);
  program.addCommand(shellCommand);
  program.addCommand(upgradeCommand);
  program.addCommand(configSecretCommand);

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
