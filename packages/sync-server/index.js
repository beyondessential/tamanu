import { log } from 'shared/services/logging';

import { program } from 'commander';

import {
  serve,
  serveCommand,
  addServeOptions,
  migrateCommand,
  reportCommand,
  setupCommand,
  calculateSurveyResultsCommand,
  removeDuplicatedPatientAdditionalDataCommand,
  loadIcaoSignerCommand,
} from './app/subCommands';

async function run() {
  program
    .description('Tamanu sync-server')
    .name('node app.bundle.js')
    .action(serve);
  addServeOptions(program);

  program.addCommand(serveCommand);
  program.addCommand(migrateCommand);
  program.addCommand(reportCommand);
  program.addCommand(setupCommand);
  program.addCommand(calculateSurveyResultsCommand);
  program.addCommand(removeDuplicatedPatientAdditionalDataCommand);
  program.addCommand(loadIcaoSignerCommand);

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
