import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import Umzug from 'umzug';
import { runPostMigration, runPreMigration } from './migrationHooks';
import { createMigrationAuditLog } from '../../utils/audit';
import { AUDIT_MIGRATION_CONTEXT_KEY } from '@tamanu/constants';
import { checkIsMigrationContextAvailable } from '../../utils/audit/checkIsMigrationContextAvailable';

/**
 * Enhances PostgreSQL "pending trigger events" errors with helpful guidance.
 * This error occurs when a migration mixes DDL and DML on the same table.
 */
function enhancePendingTriggerError(error, migrationName) {
  if (error?.original?.message?.includes('pending trigger events')) {
    const enhanced = new Error(
      `${error.message}\n\n` +
        `HINT: This error occurs when a migration has both schema changes (DDL) and data changes (DML) ` +
        `on the same table. PostgreSQL's deferred triggers queue events during DML, then block DDL.\n\n` +
        `To fix, split "${migrationName}" into separate migrations:\n` +
        `  1. First migration: schema changes (addColumn, removeColumn, etc.)\n` +
        `  2. Second migration: data changes (UPDATE, INSERT, etc.)\n` +
        `  3. Third migration: remaining schema changes (if any)\n\n` +
        `See packages/database/CLAUDE.md for details.`,
    );
    enhanced.original = error.original;
    enhanced.stack = error.stack;
    return enhanced;
  }
  return error;
}

// before this, we just cut our losses and accept irreversible migrations
const LAST_REVERSIBLE_MIGRATION = '1685403132663-systemUser.js';

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

  // Closure context to store migration name and direction
  const wrapContext = {};

  const umzug = new Umzug({
    migrations: {
      path: migrationsDir,
      params: [sequelize.getQueryInterface()],
      wrap: (updown) => (...args) => sequelize.transaction(async () => {
        const isMigrationContextAvailable = await checkIsMigrationContextAvailable(
          sequelize,
          wrapContext.migrationName,
        );
        if (!isMigrationContextAvailable) {
          try {
            return await updown(...args);
          } catch (error) {
            throw enhancePendingTriggerError(error, wrapContext.migrationName);
          }
        }

        // Create migration context object
        const migrationContext = {
          direction: wrapContext.direction,
          migrationName: wrapContext.migrationName,
          serverType: global?.serverInfo?.serverType || 'unknown',
        };

        // Set the migration context as a transaction variable
        await sequelize.setTransactionVar(AUDIT_MIGRATION_CONTEXT_KEY, JSON.stringify(migrationContext));

        try {
          return await updown(...args);
        } catch (error) {
          throw enhancePendingTriggerError(error, wrapContext.migrationName);
        } finally {
          await sequelize.setTransactionVar(AUDIT_MIGRATION_CONTEXT_KEY, null);
        }
      }),

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

  umzug.on('migrating', (name) => {
    wrapContext.direction = 'up';
    wrapContext.migrationName = name;
    log.info(`Applying migration: ${name}`);
  });
  umzug.on('reverting', (name) => {
    wrapContext.direction = 'down';
    wrapContext.migrationName = name;
    log.info(`Reverting migration: ${name}`);
  });

  return umzug;
}

export async function migrateUpTo({ log, sequelize, pending, migrations, upOpts }) {
  log.info('Running pre-migration steps...');
  await runPreMigration(log, sequelize);
  log.info(`Applied pre-migration steps successfully.`);

  log.info(`Applying ${pending.length} migration${pending.length > 1 ? 's' : ''}...`);
  const applied = await migrations.up(upOpts);
  await createMigrationAuditLog(sequelize, applied, 'up');

  log.info('Applied migrations successfully');

  log.info('Running post-migration steps...');
  await runPostMigration(log, sequelize);
  log.info(`Applied post-migration steps successfully.`);
}

async function migrateUp(log, sequelize, upOpts = undefined) {
  const migrations = createMigrationInterface(log, sequelize);

  const pending = await migrations.pending();
  if (pending.length > 0) {
    await migrateUpTo({ log, sequelize, migrations, pending, upOpts });
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

/**
 * In test mode, loads a pre-generated schema snapshot instead of running hundreds
 * of old migrations. Returns true if the snapshot was loaded, false otherwise.
 * The caller should still run migrate('up') afterwards to apply remaining migrations.
 */
export async function loadSnapshotIfAvailable(log, sequelize) {
  const migrationsDir = path.join(__dirname, '../..', 'migrations');
  const snapshotDir = path.join(migrationsDir, '__snapshot__');
  const schemaPath = path.join(snapshotDir, 'schema.sql');
  const appliedPath = path.join(snapshotDir, 'applied.json');

  if (!existsSync(schemaPath) || !existsSync(appliedPath)) {
    return false;
  }

  // Only load into a fresh DB (empty SequelizeMeta)
  const [metaCheck] = await sequelize.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'SequelizeMeta'
    ) AS "exists"`,
  );
  if (metaCheck[0].exists) {
    const [countResult] = await sequelize.query(`SELECT count(*)::int AS count FROM "SequelizeMeta"`);
    if (countResult[0].count > 0) {
      return false;
    }
  }

  const applied = JSON.parse(readFileSync(appliedPath, 'utf8'));

  // Staleness guard: ensure every migration in the snapshot still exists on disk
  const migrationFiles = new Set(
    readdirSync(migrationsDir).filter(f => /\.(js|ts)$/.test(f)),
  );
  // In dist, .ts files are compiled to .js — applied.json already uses .js names
  const staleEntries = applied.filter(name => !migrationFiles.has(name));
  if (staleEntries.length > 0) {
    log.warn(
      `Test snapshot is stale: ${staleEntries.length} migration(s) in applied.json not found on disk ` +
        `(first: ${staleEntries[0]}). Falling back to full migration run.`,
    );
    return false;
  }

  log.info(`Loading test schema snapshot (${applied.length} migrations)...`);

  const schemaSql = readFileSync(schemaPath, 'utf8');
  await sequelize.query(schemaSql);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
      "name" VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY
    );
  `);

  // Bulk-insert all snapshot migration names so Umzug considers them "already applied"
  const values = applied.map(name => `('${name.replace(/'/g, "''")}')`).join(',');
  await sequelize.query(`INSERT INTO "SequelizeMeta" ("name") VALUES ${values}`);

  log.info('Schema snapshot loaded successfully.');
  return true;
}

export function createMigrateCommand(Command, migrateCallback, name = 'migrate') {
  const migrateCommand = new Command(name).description('Apply or roll back database migrations');

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
