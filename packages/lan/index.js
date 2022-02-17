import { log } from 'shared/services/logging';

import { program } from 'commander';

import {
  serve,
  serveCommand,
  addServeOptions,
  migrateCommand,
  reportCommand,
} from './app/subCommands';

async function run() {
  program
    .description('Tamanu lan-server (runs serve by default)')
    .name('node app.bundle.js')
    .action(serve);
  addServeOptions(program);

  program.addCommand(serveCommand);
  program.addCommand(reportCommand);
  program.addCommand(migrateCommand);

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
