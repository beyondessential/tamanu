import { log } from 'shared/services/logging';
import { parseArguments } from 'shared/arguments';

import { serve, migrate, report } from './app/subCommands';

async function run(command, options) {
  const subcommand = {
    serve,
    migrate,
    report,
  }[command];

  if (!subcommand) {
    throw new Error(`Unrecognised subcommand: ${command}`);
  }

  return subcommand(options);
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
