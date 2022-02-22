import Umzug from 'umzug';
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
      path: migrationsDir,
      params: [sequelize.getQueryInterface()],
      wrap: updown => (...args) => sequelize.transaction(() => updown(...args)),
    },
    storage: 'sequelize',
    storageOptions: {
      sequelize,
    },
  });

  umzug.on('migrating', name => log.info(`Applying migration: ${name}`));
  umzug.on('reverting', name => log.info(`Reverting migration: ${name}`));

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

async function migrateDown(log, sequelize, options) {
  const migrations = createMigrationInterface(log, sequelize);
  log.info(`Reverting 1 migration...`);
  const reverted = await migrations.down(options);
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
      `There are ${pending.length} pending migrations. To start the server anyway, run with --skipMigrationCheck`,
    );
  }
}

export async function migrate(log, sequelize, options) {
  const { up, down, downToLastReversibleMigration, redoLatest } = options;
  const numArgs = [up, down, downToLastReversibleMigration, redoLatest].reduce(
    (n, arg) => (arg ? n + 1 : n),
    0,
  );
  if (numArgs > 1) {
    throw new Error(`Expected only 1 of [up, down, downToLastReversibleMigration, redoLatest]`);
  }

  if (up) {
    return migrateUp(log, sequelize);
  }
  if (down) {
    return migrateDown(log, sequelize);
  }
  if (downToLastReversibleMigration) {
    return migrateDown(log, sequelize, { to: LAST_REVERSIBLE_MIGRATION });
  }
  if (redoLatest) {
    await migrateDown(log, sequelize);
    return migrateUp(log, sequelize);
  }
  throw new Error(`Unrecognised migrate direction: ${options.migrateDirection}`);
}

// addMigrateOptions adds shared migration options to a command
export function createMigrateCommand(Command) {
  return new Command('migrate')
    .description('Apply or roll back database migrations')
    .option('--down', 'Reverse the most recent migration')
    .option('--up', 'Run all unrun migrations until up to date')
    .option(
      '--downToLastReversibleMigration',
      'Run database migrations down to the last known reversible migration (LAST_REVERSIBLE_MIGRATION)',
    )
    .option('--redoLatest', 'Run database migrations down 1 and then up 1');
}
