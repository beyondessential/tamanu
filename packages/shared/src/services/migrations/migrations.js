import Umzug from 'umzug';
import { readdirSync } from 'fs';
import path from 'path';
import { runPostMigration } from './runPostMigration';
import { wrap, chain } from 'lodash';

// before this, we just cut our losses and accept irreversible migrations
const LAST_REVERSIBLE_MIGRATION = '048_changeNoteRecordTypeColumn.js';
const NO_SYNC_MIGRATION_TIMESTAMP = '1692710205000';

export function createMigrationInterface(log, sequelize) {
  // ie, shared/src/migrations
  const migrationsDir = path.join(__dirname, '../..', 'migrations');

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
      customResolver: sqlPath => {
        const migration = require(sqlPath);
        const transaction = (updown, ...args) => sequelize.transaction(() => updown(...args));
        const disableSyncTrigger = async (updown, query, ...args) => {
          await query.sequelize.query("SET LOCAL tamanu.sync TO 'disabled';");
          await updown(query, ...args);
        };

        const timestamp = path.basename(sqlPath).split(/[-_]/, 1);
        const is_no_sync = !migration.NON_DETERMINISTIC && timestamp > NO_SYNC_MIGRATION_TIMESTAMP;

        return chain(migration)
          .pick(['up', 'down'])
          .mapValues(updown => is_no_sync ? wrap(updown, disableSyncTrigger) : updown)
          .mapValues(updown => wrap(updown, transaction))
          .value();
      }
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
    log.info(`Applied migrations successfully, running post-migration steps...`);
    await runPostMigration(log, sequelize);
    log.info(`Applied post-migration steps successfully.`);
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
      `There are ${pending.length} pending migrations. Either run them manually, set "db.migrateOnStartup" to true in your local.json5 config file, or start the server again with --skipMigrationCheck to ignore them`,
    );
  }
}

export async function migrate(log, sequelize, direction) {
  if (direction === 'up') {
    return migrateUp(log, sequelize);
  }
  if (direction === 'down') {
    return migrateDown(log, sequelize);
  }
  if (direction === 'downToLastReversibleMigration') {
    return migrateDown(log, sequelize, { to: LAST_REVERSIBLE_MIGRATION });
  }
  if (direction === 'redoLatest') {
    await migrateDown(log, sequelize);
    return migrateUp(log, sequelize);
  }
  throw new Error(`Unrecognised migrate direction: ${direction}`);
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
    .description('Reverse the most recent migration')
    .action(() => migrateCallback('down'));

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
