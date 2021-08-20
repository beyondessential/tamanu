import { ArgumentParser } from 'argparse';
import { log } from 'shared/services/logging';

import { version } from 'argparse/package';
console.log("shared version", version);

const ARGS = (process.env.TAMANU_ARGS || 'check')
  .trim()
  .split(/\s+/g)
  .filter(x => x);

function createParser() {
  const parser = new ArgumentParser({
    description: '',
  });

  parser.add_argument('command', {
    choices: [
      'serve',
      'migrate', 
    ],
    nargs: '?', // allow empty
    default: 'serve',
  });

  const migrateDir = parser.add_mutually_exclusive_group();
  migrateDir.add_argument('--up', {
    help: "Run database migrations",
    action: 'store_const',
    default: 'up',
    dest: 'migrateDirection',
    const: 'up',
  });
  migrateDir.add_argument('--down', {
    help: "Run database migrations",
    action: 'store_const',
    dest: 'migrateDirection',
    const: 'down',
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
