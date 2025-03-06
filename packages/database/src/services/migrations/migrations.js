import { readdirSync } from 'node:fs';
import path from 'node:path';
import Umzug from 'umzug';
import { runPostMigration, runPreMigration } from './migrationHooks';
import { CURRENT_SYNC_TIME_KEY } from '../../sync';

// before this, we just cut our losses and accept irreversible migrations
const LAST_REVERSIBLE_MIGRATION = '1685403132663-systemUser.js';

const createMigrationAuditLog = async (sequelize, migrations, direction) => {
  const [tableExists] = (await sequelize.query(
    `
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'logs'
      AND table_name = 'migrations';
    `,
    {
      type: sequelize.QueryTypes.SELECT,
    },
  ))
  if (!tableExists) return;
  await sequelize.query(
    `
      INSERT INTO logs.migrations (logged_at, direction, migrations, current_sync_tick)
      VALUES (
        CURRENT_TIMESTAMP,
        $1,
        $2,
        (
          SELECT value::bigint AS current_sync_tick
          FROM local_system_facts
          WHERE key = '${CURRENT_SYNC_TIME_KEY}'
        )
      );
    `,
    {
      type: sequelize.QueryTypes.INSERT,
      bind: [direction, migrations.map((migration) => migration.file).join(',')],
    },
  );
};

export function createMigrationInterface(log, sequelize) {
  // ie, database/dist/cjs/migrations
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
      wrap:
        (updown) =>
        (...args) =>
          sequelize.transaction(async () => updown(...args)),

      customResolver: async (sqlPath) => {
        const migrationImport = await import(sqlPath);
        const migration = 'default' in migrationImport ? migrationImport.default : migrationImport;

        if (!('up' in migration)) {
          throw new Error(`Migration ${sqlPath} must export an up function`);
        }

        if (!('down' in migration)) {
          migration.down = () => {};
        }

        return migration;
      },
    },
    storage: 'sequelize',
    storageOptions: {
      sequelize,
    },
  });

  umzug.on('migrating', (name) => log.info(`Applying migration: ${name}`));
  umzug.on('reverting', (name) => log.info(`Reverting migration: ${name}`));

  return umzug;
}

async function migrateUp(log, sequelize) {
  const migrations = createMigrationInterface(log, sequelize);

  const pending = await migrations.pending();
  if (pending.length > 0) {
    log.info('Running pre-migration steps...');
    await runPreMigration(log, sequelize);
    log.info(`Applied pre-migration steps successfully.`);

    log.info(`Applying ${pending.length} migration${pending.length > 1 ? 's' : ''}...`);
    const applied = await migrations.up();
    await createMigrationAuditLog(sequelize, applied, 'up');

    log.info('Applied migrations successfully');

    log.info('Running post-migration steps...');
    await runPostMigration(log, sequelize);
    log.info(`Applied post-migration steps successfully.`);
  } else {
    log.info('Migrations already up-to-date.');
  }
}

async function migrateDown(log, sequelize, options) {
  const migrations = createMigrationInterface(log, sequelize);

  log.info('Running pre-migration steps...');
  await runPreMigration(log, sequelize);
  log.info(`Applied pre-migration steps successfully.`);

  log.info(`Reverting 1 migration...`);
  const reverted = await migrations.down(options);
  await createMigrationAuditLog(sequelize, Array.isArray(reverted) ? reverted : [reverted], 'down');

  if (Array.isArray(reverted)) {
    if (reverted.length === 0) {
      log.warn(`No migrations to revert.`);
    } else {
      log.info(`Reverted migrations successfully.`);
    }
  } else {
    log.info(`Reverted migration ${reverted.file}.`);
  }

  log.info('Running post-migration steps...');
  await runPostMigration(log, sequelize);
  log.info(`Applied post-migration steps successfully.`);
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
