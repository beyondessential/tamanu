import { readdirSync } from 'node:fs';
import path from 'node:path';
import Umzug from 'umzug';
import { runPostMigration, runPreMigration } from './migrationHooks';
import { createMigrationAuditLog, tryGatherPreMigrationDbSnapshot } from '../../utils/audit';
import { syncDatabaseServerVersion } from '../../utils/databaseVersionCompatibility';
import { AUDIT_MIGRATION_CONTEXT_KEY } from '@tamanu/constants';
import { checkIsMigrationContextAvailable } from '../../utils/audit/checkIsMigrationContextAvailable';

/**
 * Sentinel thrown to force a managed transaction to roll back at the end of a dry run, while
 * carrying fn's result back out. Caught by runInRollbackTransaction so it never surfaces as a
 * real error.
 */
class DryRunRollback extends Error {
  constructor(result) {
    super();
    this.result = result;
  }
}

/**
 * Runs `fn` inside a managed transaction that is always rolled back, so a dry run can
 * exercise the real migration/upgrade code path (including DDL, DML and audit writes)
 * without committing anything. `fn` receives the outer Transaction object; pass it as
 * `parentTransaction` so inner `sequelize.transaction()` calls nest as SAVEPOINTs rather
 * than opening independent connections that would commit for real (Sequelize does not
 * auto-nest transactions from CLS — only individual queries attach to the current one).
 */
export async function runInRollbackTransaction(sequelize, fn) {
  try {
    await sequelize.transaction(async (outerTransaction) => {
      // Throwing rolls the transaction back; the sentinel carries fn's result back out.
      throw new DryRunRollback(await fn(outerTransaction));
    });
  } catch (error) {
    if (error instanceof DryRunRollback) {
      return error.result;
    }
    throw error;
  }
}

/**
 * Fires any pending DEFERRABLE INITIALLY DEFERRED constraint triggers (e.g. the changelog
 * audit triggers) immediately, then returns to deferred mode. During a dry run every
 * migration runs as a SAVEPOINT under one outer transaction; RELEASE SAVEPOINT does not
 * fire deferred triggers (only the outer COMMIT does), so without this they accumulate and
 * a later DDL migration trips "cannot ALTER TABLE ... pending trigger events" on a table an
 * earlier DML migration wrote to. Flushing at each migration boundary mimics the
 * per-migration COMMIT of a real run; the flushed writes still roll back with the dry run.
 */
export async function flushDeferredConstraints(sequelize) {
  await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE');
  await sequelize.query('SET CONSTRAINTS ALL DEFERRED');
}

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

/**
 * `options.dryRun`: when true, each migration runs as a SAVEPOINT under
 * `options.parentTransaction` (the outer dry-run transaction) and deferred audit triggers
 * are flushed at each boundary so a rolled-back dry run behaves like a real run.
 *
 * @returns {{ migrations: import('umzug'), getDurationStats: () => Record<string, number> }}
 */
export function createMigrationInterface(log, sequelize, options = {}) {
  const { dryRun = false, parentTransaction = null } = options;

  // In a dry run each migration nests as a SAVEPOINT under parentTransaction. Without one,
  // `sequelize.transaction({ transaction: null })` would silently open an independent top-level
  // transaction that commits for real, defeating the rollback — so fail loudly instead.
  if (dryRun && !parentTransaction) {
    throw new Error('createMigrationInterface: a dry run requires a parentTransaction.');
  }

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
      // In a dry run, nest each migration as a SAVEPOINT under the outer dry-run
      // transaction (Sequelize only nests when the parent is passed explicitly); otherwise
      // each migration runs in its own top-level transaction as usual.
      wrap: (updown) => (...args) => {
        const transactionArgs = dryRun ? [{ transaction: parentTransaction }] : [];
        return sequelize.transaction(...transactionArgs, async () => {
          // Flush the previous migration's deferred audit triggers before this one's DDL,
          // mimicking the per-migration COMMIT that a real run would have done by now.
          if (dryRun) {
            await flushDeferredConstraints(sequelize);
          }

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
        });
      },

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
  dryRun = false,
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

  // Flush the last migration's deferred audit triggers before the post-migration DDL.
  if (dryRun) {
    await flushDeferredConstraints(sequelize);
  }

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
  const { dryRun = false, parentTransaction = null } = options;
  const { migrations, getDurationStats } = createMigrationInterface(log, sequelize, {
    dryRun,
    parentTransaction,
  });

  // Fail fast: refuse before applying migrations if the database is already ahead of this server.
  await syncDatabaseServerVersionForMigrateUp(sequelize, { ...options, checkOnly: true });

  const pending = await migrations.pending();
  if (pending.length > 0) {
    await migrateUpTo({ log, sequelize, migrations, getDurationStats, pending, upOpts, dryRun });
  } else {
    log.info('Migrations already up-to-date.');
  }

  await syncDatabaseServerVersionForMigrateUp(sequelize, options);

  return pending.length;
}

async function syncDatabaseServerVersionForMigrateUp(sequelize, options) {
  const models = sequelize.models;
  if (!models?.LocalSystemFact) {
    return;
  }

  await syncDatabaseServerVersion({
    models,
    serverVersion: options.serverVersion,
    checkOnly: options.checkOnly,
  });
}

async function migrateDown(log, sequelize, options = {}) {
  const { dryRun = false, parentTransaction = null, to } = options;
  const { migrations, getDurationStats } = createMigrationInterface(log, sequelize, {
    dryRun,
    parentTransaction,
  });

  const batchStart = Date.now();

  log.info('Running pre-migration steps...');
  await runPreMigration(log, sequelize);
  log.info(`Applied pre-migration steps successfully.`);

  log.info(`Reverting 1 migration...`);

  const preSnapshot = await tryGatherPreMigrationDbSnapshot(log, sequelize);

  const reverted = await migrations.down(to ? { to } : undefined);
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

  // Flush the reverted migration's deferred audit triggers before the post-migration DDL.
  if (dryRun) {
    await flushDeferredConstraints(sequelize);
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
  const { dryRun = false } = options;

  if (dryRun && direction !== 'up' && direction !== 'redoLatest') {
    throw new Error(`--dry-run is only supported for 'up' and 'redoLatest', not '${direction}'.`);
  }

  const run = async (parentTransaction = null) => {
    const opts = { ...options, parentTransaction };
    if (direction === 'up') {
      return migrateUp(log, sequelize, undefined, opts);
    }
    if (direction === 'down') {
      return migrateDown(log, sequelize, opts);
    }
    if (direction === 'downToLastReversibleMigration') {
      return migrateDown(log, sequelize, { ...opts, to: LAST_REVERSIBLE_MIGRATION });
    }
    if (direction === 'redoLatest') {
      await migrateDown(log, sequelize, opts);
      return migrateUp(log, sequelize, undefined, opts);
    }
    throw new Error(`Unrecognised migrate direction: ${direction}`);
  };

  if (dryRun) {
    log.info(
      'DRY RUN: applying migrations in a transaction that will be rolled back; no changes will be committed.',
    );
    const migrationCount = await runInRollbackTransaction(sequelize, run);
    log.info(
      `DRY RUN complete — ${migrationCount ?? 0} migration${migrationCount === 1 ? '' : 's'} would be applied; rolled back, no changes committed.`,
    );
    return undefined;
  }

  return run();
}

export function createMigrateCommand(Command, migrateCallback, name = 'migrate') {
  const migrateCommand = new Command(name).description('Apply or roll back database migrations');

  migrateCommand
    .command('up', { isDefault: true })
    .description('Run all unrun migrations until up to date')
    .option(
      '--dry-run',
      'Apply migrations in a transaction then roll back, without committing any changes',
    )
    .action((options) => migrateCallback('up', { dryRun: Boolean(options.dryRun) }));

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
    .option(
      '--dry-run',
      'Run the down and up in a transaction then roll back, without committing any changes',
    )
    .action((options) => migrateCallback('redoLatest', { dryRun: Boolean(options.dryRun) }));

  return migrateCommand;
}
