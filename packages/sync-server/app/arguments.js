import { ArgumentParser } from 'argparse';
import { log } from 'shared/services/logging';

const ARGS = (process.env.TAMANU_ARGS || 'migrate --up')
  .trim()
  .split(/\s+/g)
  .filter(x => x);

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
  dest: 'migrateDir',
  const: 'up',
});
migrateDir.add_argument('--down', {
  help: "Run database migrations",
  action: 'store_const',
  dest: 'migrateDir',
  const: 'down',
});

export function parseArguments() {
  if (ARGS && ARGS.length > 0) {
    log.info(`Running app with TAMANU_ARGS of ${ARGS}`);
    return parser.parse_args(ARGS);
  } else {
    return parser.parse_args();
  }
}
