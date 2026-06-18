import { readdirSync } from 'node:fs';
import path from 'node:path';
import Umzug from 'umzug';
import { runPostMigration, runPreMigration } from './migrationHooks';
import { createMigrationAuditLog, tryGatherPreMigrationDbSnapshot } from '../../utils/audit';
import { syncDatabaseServerVersion } from '../../utils/databaseVersionCompatibility';
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

function migrationDurationsForBatch(durationStats, batchMigrations) {
  const out = {};
  for (const m of batchMigrations) {
    if (!m?.file) continue;
    // Umzug emits duration keys without the file extension; m.file is basename with extension.
    const base = path.basename(m.file, path.extname(m.file));
    const ms = durationStats[m.file] ?? durationStats[base];
    if (typeof ms === 'number') {
      out[m.file] = ms;
    }
  }
  return out;
}

function totalMigrationsDurationMsFromMap(durationMsPerMigration) {
  return Object.values(durationMsPerMigration).reduce((a, b) => a + b, 0);
}

// Umzug's down({ to }) INCLUDES the target in the revert. The baseline's down
// drops all schemas, so we must not include it. Use the first post-baseline
// migration as the revert boundary instead.
const LAST_REVERSIBLE_MIGRATION = '1744340076240-fixRaceConditionInSettingUpdateSyncTick.js';

/** @returns {{ migrations: import('umzug'), getDurationStats: () => Record<string, number> }} */
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

  // Duration stats for each migration
  const durationStats = {};

  // Closure context to store migration name and direction
  const wrapContext = {};

  const umzug = new Umzug({
    migrations: {
      path: migrationsDir,
      pattern: /^\d+[\w-]+\.(js|ts)$/,
      params: [sequelize.getQueryInterface()],
      wrap: (updown) => (...args) => sequelize.transaction(async () => {
        const isMigrationContextAvailable = await checkIsMigrationContextAvailable(sequelize);
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
          try {
            await sequelize.setTransactionVar(AUDIT_MIGRATION_CONTEXT_KEY, null);
          } catch {
            // Transaction already aborted; rollback will clean up.
          }
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
    durationStats[name] = Date.now();
  });
  umzug.on('migrated', (name) => {
    durationStats[name] = Date.now() - durationStats[name];
  });
  umzug.on('reverting', (name) => {
    wrapContext.direction = 'down';
    wrapContext.migrationName = name;
    log.info(`Reverting migration: ${name}`);
    durationStats[name] = Date.now();
  });
  umzug.on('reverted', (name) => {
    durationStats[name] = Date.now() - durationStats[name];
  });

  // Clean SequelizeMeta entries for files no longer on disk (frozen migrations
  // squashed into the baseline) before any revert so Umzug can find all files.
  const filesOnDisk = new Set(migrationFiles);
  const originalDown = umzug.down.bind(umzug);
  umzug.down = async (...args) => {
    const [executed] = await sequelize.query('SELECT name FROM "SequelizeMeta"');
    const orphaned = executed.map(r => r.name).filter(name => !filesOnDisk.has(name));
    if (orphaned.length > 0) {
      await sequelize.query(
        `DELETE FROM "SequelizeMeta" WHERE name IN (${orphaned.map((_, i) => `$${i + 1}`).join(',')})`,
        { bind: orphaned },
      );
      log.info(`Removed ${orphaned.length} orphaned entries from SequelizeMeta (squashed into baseline)`);
    }
    return originalDown(...args);
  };

  return {
    migrations: umzug,
    getDurationStats: () => durationStats,
  };
}

export async function migrateUpTo({
  log,
  sequelize,
  pending,
  migrations,
  getDurationStats,
  upOpts,
  upgradeRunId,
}) {
  const batchStart = Date.now();

  log.info('Running pre-migration steps...');
  await runPreMigration(log, sequelize);
  log.info(`Applied pre-migration steps successfully.`);

  log.info(`Applying ${pending.length} migration${pending.length > 1 ? 's' : ''}...`);

  const preSnapshot = await tryGatherPreMigrationDbSnapshot(log, sequelize);

  const applied = await migrations.up(upOpts);
  const durationStats = getDurationStats();
  const durationMsPerMigration = migrationDurationsForBatch(durationStats, applied);
  const totalMigrationsDurationMs = totalMigrationsDurationMsFromMap(durationMsPerMigration);

  log.info('Applied migrations successfully');

  log.info('Running post-migration steps...');
  await runPostMigration(log, sequelize);
  log.info(`Applied post-migration steps successfully.`);

  const batchDurationMs = Date.now() - batchStart;

  await createMigrationAuditLog(sequelize, applied, 'up', {
    batchDurationMs,
    upgradeRunId,
    stats: {
      durationMsPerMigration,
      totalMigrationsDurationMs,
      ...(preSnapshot ? { preSnapshot } : {}),
    },
  });
}

async function migrateUp(log, sequelize, upOpts = undefined, options = {}) {
  const { migrations, getDurationStats } = createMigrationInterface(log, sequelize);

  // Fail fast: refuse before applying migrations if the database is already ahead of this server.
  await syncDatabaseServerVersionForMigrateUp(sequelize, { ...options, checkOnly: true });

  const pending = await migrations.pending();
  if (pending.length > 0) {
    await migrateUpTo({ log, sequelize, migrations, getDurationStats, pending, upOpts });
  } else {
    log.info('Migrations already up-to-date.');
  }

  await syncDatabaseServerVersionForMigrateUp(sequelize, options);
}

async function syncDatabaseServerVersionForMigrateUp(sequelize, options) {
  const models = sequelize.models;
  if (!models?.LocalSystemFact) {
    return;
  }

  await syncDatabaseServerVersion({
    models,
    serverVersion: options.serverVersion,
    skipVersionCompatibilityCheck: options.skipVersionCompatibilityCheck,
    checkOnly: options.checkOnly,
  });
}

async function migrateDown(log, sequelize, options) {
  const { migrations, getDurationStats } = createMigrationInterface(log, sequelize);

  const batchStart = Date.now();

  log.info('Running pre-migration steps...');
  await runPreMigration(log, sequelize);
  log.info(`Applied pre-migration steps successfully.`);

  log.info(`Reverting 1 migration...`);

  const preSnapshot = await tryGatherPreMigrationDbSnapshot(log, sequelize);

  const reverted = await migrations.down(options);
  const revertedList = Array.isArray(reverted) ? reverted : [reverted];
  const durationStats = getDurationStats();
  const durationMsPerMigration = migrationDurationsForBatch(durationStats, revertedList);
  const totalMigrationsDurationMs = totalMigrationsDurationMsFromMap(durationMsPerMigration);

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

  const batchDurationMs = Date.now() - batchStart;

  await createMigrationAuditLog(sequelize, revertedList, 'down', {
    batchDurationMs,
    stats: {
      durationMsPerMigration,
      totalMigrationsDurationMs,
      ...(preSnapshot ? { preSnapshot } : {}),
    },
  });
}

export async function assertUpToDate(log, sequelize, options) {
  if (options.skipMigrationCheck) return;

  const { migrations } = createMigrationInterface(log, sequelize);
  const pending = await migrations.pending();
  if (pending.length > 0) {
    throw new Error(
      `There are ${pending.length} pending migrations. Either run them manually, set "db.migrateOnStartup" to true in your local.json5 config file, or start the server again with --skipMigrationCheck to ignore them`,
    );
  }
}

export async function migrate(log, sequelize, direction, options = {}) {
  if (direction === 'up') {
    return migrateUp(log, sequelize, undefined, options);
  }
  if (direction === 'down') {
    return migrateDown(log, sequelize);
  }
  if (direction === 'downToLastReversibleMigration') {
    return migrateDown(log, sequelize, { to: LAST_REVERSIBLE_MIGRATION });
  }
  if (direction === 'redoLatest') {
    await migrateDown(log, sequelize);
    return migrateUp(log, sequelize, undefined, options);
  }
  throw new Error(`Unrecognised migrate direction: ${direction}`);
}

export function createMigrateCommand(Command, migrateCallback, name = 'migrate') {
  const migrateCommand = new Command(name).description('Apply or roll back database migrations');
  migrateCommand.option(
    '--skipVersionCompatibilityCheck',
    'skip the database version compatibility check',
  );

  migrateCommand
    .command('up', { isDefault: true })
    .description('Run all unrun migrations until up to date')
    .action(() => migrateCallback('up', migrateCommand.opts()));

  migrateCommand
    .command('down')
    .description('Reverse the most recent migration')
    .action(() => migrateCallback('down', migrateCommand.opts()));

  migrateCommand
    .command('downToLastReversibleMigration')
    .description(
      'Run database migrations down to the last known reversible migration (LAST_REVERSIBLE_MIGRATION)',
    )
    .action(() => migrateCallback('downToLastReversibleMigration', migrateCommand.opts()));

  migrateCommand
    .command('redoLatest')
    .description('Run database migrations down 1 and then up 1')
    .action(() => migrateCallback('redoLatest', migrateCommand.opts()));

  return migrateCommand;
}
