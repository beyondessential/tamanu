import { ArgumentParser } from 'argparse';
import { log } from 'shared/services/logging';

import { version } from 'argparse/package';

const ARGS = (process.env.TAMANU_ARGS || '')
  .trim()
  .split(/\s+/g)
  .filter(x => x);

function createParser() {
  const parser = new ArgumentParser({
    description: '',
  });

  parser.addArgument('command', {
    choices: [
      'serve',
      'migrate', 
    ],
    nargs: '?', // allow empty
    defaultValue: 'serve',
  });

  const migrateDir = parser.addMutuallyExclusiveGroup();
  migrateDir.addArgument('--up', {
    help: "Run database migrations",
    action: 'storeConst',
    defaultValue: 'up',
    dest: 'migrateDirection',
    constant: 'up',
  });
  migrateDir.addArgument('--down', {
    help: "Run database migrations",
    action: 'storeConst',
    dest: 'migrateDirection',
    constant: 'down',
  });

  return parser;
}

export function parseArguments() {
  const parser = createParser();
  if (ARGS && ARGS.length > 0) {
    log.info(`Running app with TAMANU_ARGS of ${ARGS}`);
    return parser.parseArgs(ARGS);
  } else {
    return parser.parseArgs();
  }
}
