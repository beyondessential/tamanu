import { ArgumentParser } from 'argparse';
import { log } from 'shared/services/logging';

// allow other methods of passing args in
// env: allows yarn to pass through commands past webpack & babel
// DEV_ARGS (below): allows a developer to benefit from live-reload
//  while working on arguments-related stuff.
const DEV_ARGS = '';
const ARGS = (process.env.TAMANU_ARGS || DEV_ARGS)
  .trim()
  .split(/\s+/g)
  .filter(x => x);

function createParser() {
  const parser = new ArgumentParser({
    description: '',
  });

  parser.addArgument('command', {
    choices: ['serve', 'setup', 'migrate', 'report', 'calculateSurveyResults'],
    nargs: '?', // allow empty
    defaultValue: 'serve',
  });

  parser.addArgument('--name', {
    action: 'store',
    dest: 'name',
  });

  parser.addArgument('--parameters', {
    action: 'store',
    dest: 'parameters',
  });

  parser.addArgument('--recipients', {
    action: 'store',
    dest: 'recipients',
  });

  // migrate subcommand
  const migrateDir = parser.addMutuallyExclusiveGroup();
  migrateDir.addArgument('--up', {
    help: 'Run database migrations',
    action: 'storeConst',
    defaultValue: 'up',
    dest: 'migrateDirection',
    constant: 'up',
  });
  migrateDir.addArgument('--down', {
    help: 'Run database migrations',
    action: 'storeConst',
    dest: 'migrateDirection',
    constant: 'down',
  });
  migrateDir.addArgument('--redoLatest', {
    help: 'Run database migrations down 1 and then up 1',
    action: 'storeConst',
    dest: 'migrateDirection',
    constant: 'redoLatest',
  });
  parser.addArgument('--skipMigrationCheck', {
    dest: 'skipMigrationCheck',
    action: 'storeTrue',
    defaultValue: false,
  });

  return parser;
}

export function parseArguments() {
  const parser = createParser();
  if (ARGS && ARGS.length > 0) {
    log.info(`Running app with TAMANU_ARGS of ${ARGS}`);
    return parser.parseArgs(ARGS);
  }
  return parser.parseArgs();
}
