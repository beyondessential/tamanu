import { Umzug, SequelizeStorage } from 'umzug';
import { readdirSync } from 'fs';
import path from 'path';

// before this, we just cut our losses and accept irreversible migrations
const LAST_REVERSIBLE_MIGRATION = '048_changeNoteRecordTypeColumn.js';

export function createMigrationInterface(log, sequelize) {
  // ie, shared/src/migrations
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  // Double check the migrations directory exists (should catch any issues
  // arising out of build systems omitting the migrations dir, for eg)
  // Note that Umzug will throw if the directory is missing, but won't report
  // errors if the directory is empty - so this is maybe overcautious, but, it's
  // just a few ms on startup, we'll be ok.
  const migrationFiles = readdirSync(migrationsDir);
  if (migrationFiles.length === 0) {
    throw new Error('Could not find migrations');
  }

  const umzug = new Umzug({
    migrations: {
      glob: `${migrationsDir}/*.js`,
      params: [sequelize.getQueryInterface()],
      wrap: updown => (...args) => sequelize.transaction(() => updown(...args)),
    },
    storage: new SequelizeStorage({ sequelize }),
  });

  umzug.on('migrating', ({ name }) => log.info(`Applying migration: ${name}`));
  umzug.on('reverting', ({ name }) => log.info(`Reverting migration: ${name}`));

  return umzug;
}

async function migrateUp(log, sequelize) {
  const migrations = createMigrationInterface(log, sequelize);

  const pending = await migrations.pending();
  if (pending.length > 0) {
    log.info(`Applying ${pending.length} migration${pending.length > 1 ? 's' : ''}...`);
    await migrations.up();
    log.info(`Applied migrations successfully.`);
  } else {
    log.info('Migrations already up-to-date.');
  }
}

async function migrateDown(log, sequelize, { steps, to }) {
  const migrations = createMigrationInterface(log, sequelize);
  const step = to ? null : steps || 1;
  log.info(
    `Reverting ${step ? `${step} ` : ''}migration${step === null || step > 1 ? 's' : ''}${
      to ? ` up to ${to}` : ''
    }...`,
  );
  const reverted = await migrations.down({ step, to });
  if (Array.isArray(reverted)) {
    if (reverted.length === 0) {
      log.warn(`No migrations to revert.`);
    } else {
      log.info(`Reverted migrations successfully.`);
    }
  } else {
    log.info(`Reverted migration ${reverted.file}.`);
  }
}

export async function assertUpToDate(log, sequelize, options) {
  if (options.skipMigrationCheck) return;

  const migrations = createMigrationInterface(log, sequelize);
  const pending = await migrations.pending();
  if (pending.length > 0) {
    throw new Error(
      `There are ${pending.length} pending migrations. Either run them manually, set "db.migrateOnStartup" to true in your local.json config file, or start the server again with --skipMigrationCheck to ignore them`,
    );
  }
}

export async function migrate(log, sequelize, action, args) {
  if (action === 'up') {
    return migrateUp(log, sequelize);
  }
  if (action === 'down') {
    const { steps } = args;
    return migrateDown(log, sequelize, { steps });
  }
  if (action === 'downToLastReversibleMigration') {
    return migrateDown(log, sequelize, { to: LAST_REVERSIBLE_MIGRATION });
  }
  if (action === 'redoLatest') {
    await migrateDown(log, sequelize);
    return migrateUp(log, sequelize);
  }
  throw new Error(`Unrecognised migrate action: ${action}`);
}

export function createMigrateCommand(Command, migrateCallback) {
  const migrateCommand = new Command('migrate').description(
    'Apply or roll back database migrations',
  );

  migrateCommand
    .command('up', { isDefault: true })
    .description('Run all unrun migrations until up to date')
    .action(() => migrateCallback('up'));

  migrateCommand
    .command('down')
    .description('Reverse the most recent migration(s)')
    .argument('<steps>', 'Number of migrations to reverse')
    .action(steps => migrateCallback('down', { steps }));

  migrateCommand
    .command('downToLastReversibleMigration')
    .description(
      'Run database migrations down to the last known reversible migration (LAST_REVERSIBLE_MIGRATION)',
    )
    .action(() => migrateCallback('downToLastReversibleMigration'));

  migrateCommand
    .command('redoLatest')
    .description('Run database migrations down 1 and then up 1')
    .action(() => migrateCallback('redoLatest'));

  return migrateCommand;
}
