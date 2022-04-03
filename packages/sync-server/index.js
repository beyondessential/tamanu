import { program } from 'commander';
import { log } from 'shared/services/logging';

import { version } from './package.json';

import {
  serveCommand,
  migrateCommand,
  reportCommand,
  setupCommand,
  calculateSurveyResultsCommand,
  removeDuplicatedPatientAdditionalDataCommand,
  loadIcaoSignerCommand,
  userCommand,
  saveCertificateRequestCommand,
} from './app/subCommands';

async function run() {
  program
    .version(version)
    .description('Tamanu sync-server')
    .name('node app.bundle.js');

  program.addCommand(serveCommand, { isDefault: true });
  program.addCommand(migrateCommand);
  program.addCommand(reportCommand);
  program.addCommand(setupCommand);
  program.addCommand(calculateSurveyResultsCommand);
  program.addCommand(removeDuplicatedPatientAdditionalDataCommand);
  program.addCommand(loadIcaoSignerCommand);
  program.addCommand(userCommand);
  program.addCommand(saveCertificateRequestCommand);

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
