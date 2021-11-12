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

  // TODO: actual subcommands
  parser.addArgument('command', {
    choices: ['serve', 'setup', 'migrate', 'report', 'create-user', 'create-api-token'],
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

  parser.addArgument('--displayName', {
    action: 'store',
    dest: 'displayName',
  });

  parser.addArgument('--email', {
    action: 'store',
    dest: 'email',
  });

  parser.addArgument('--password', {
    action: 'store',
    dest: 'password',
  });

  parser.addArgument('--role', {
    action: 'store',
    dest: 'role',
  });

  parser.addArgument('--type', {
    action: 'store',
    dest: 'type',
  });

  parser.addArgument('--userId', {
    action: 'store',
    dest: 'userId',
  });

  parser.addArgument('--expiresIn', {
    action: 'store',
    dest: 'expiresIn',
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
