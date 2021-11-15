import { log } from 'shared/services/logging';
import { parseArguments } from 'shared/arguments';

import { initDatabase } from './app/database';
import { migrate, report, serve, setup, calculateSurveyResults } from './subCommands';

async function run(command, options) {
  const subcommand = {
    serve,
    migrate,
    setup,
    report,
    calculateSurveyResults,
  }[command];

  if (!subcommand) {
    throw new Error(`Unrecognised subcommand: ${command}`);
  }

  const { store } = await initDatabase({ testMode: false });
  return subcommand(store, options);
}

// catch and exit if run() throws an error
(async () => {
  try {
    const { command, ...options } = parseArguments();
    await run(command, options);
  } catch (e) {
    log.error(`run(): fatal error: ${e.toString()}`);
    log.error(e.stack);
    process.exit(1);
  }
})();
