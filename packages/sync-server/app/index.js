// serverInfo must be imported before any shared modules
// so that it can set globals
// eslint-disable-next-line import/order
import { version } from './serverInfo';

import { program } from 'commander';
import { log } from '@tamanu/shared/services/logging';

import * as cmd from './subCommands';
import { setupEnv } from './env';
import { closeDatabase } from './database';

// allow commands to be hidden if e.g. they're deprecated
const hiddenCommands = [
  'migrateChangelogNotesToEncounterHistoryCommand',
  'migrateNotePagesToNotesCommand',
  'removeDuplicatedDischargesCommand',
];

async function run() {
  program
    .version(version)
    .description('Tamanu Central server')
    .name('node dist');

  for (const [key, command] of Object.entries(cmd).filter(([k]) => /^\w+Command$/.test(k))) {
    const hidden = hiddenCommands.includes(key);
    program.addCommand(command, { hidden, isDefault: key === 'serveAllCommand' });
  }

  setupEnv();
  await program.parseAsync(process.argv);

  log.debug('run(): closing database connection...');
  await closeDatabase();
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
