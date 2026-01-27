#!/usr/bin/env node
/**
 * Performance-test specific database migrations by running their up() with timing.
 *
 * USE ONLY ON A COPY OF YOUR DATABASE. This runs the real migration logic and
 * modifies data. It does not record the migration in SequelizeMeta, so the same
 * migration would run again on the next normal migrate. Restore from backup or
 * use a staging clone.
 *
 * Prerequisites:
 *   1. Build the database package: npm run build --workspace @tamanu/database
 *   2. Point config at your DB copy: NODE_CONFIG_DIR=packages/central-server/config
 *      (and use a local.json5 / config that targets the copy).
 *
 * Usage (from repo root):
 *   NODE_CONFIG_DIR=packages/central-server/config node scripts/performance-test-migrations.mjs \
 *     1748555633925-fullyResyncPatientProgramRegistrations \
 *     1750719607520-backfillInitialSyncLookupTick \
 *     1754351568045-fullyResyncPatientProgramRegistrationsAndConditions \
 *     1755237235317-RebuildLookupTableForPrescriptionsChanges
 *
 * Optional: --dry-run to only resolve and load migrations, then exit (no DB run).
 */

import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const require = createRequire(import.meta.url);

async function main() {
  const argv = process.argv.slice(2).filter(Boolean);
  const dryRun = argv.includes('--dry-run');
  const migrationNames = argv.filter((a) => !a.startsWith('--'));

  if (migrationNames.length === 0) {
    console.error(
      'Usage: NODE_CONFIG_DIR=packages/central-server/config node scripts/performance-test-migrations.mjs <migration1> [migration2 ...] [--dry-run]',
    );
    console.error('Example: ... 1748555633925-fullyResyncPatientProgramRegistrations');
    process.exit(1);
  }

  if (!dryRun) {
    console.warn(
      '\n*** WARNING: This will run the migration up() on the database pointed to by config. ***',
    );
    console.warn('*** Use only on a copy of your database (restore from backup or staging). ***\n');
  }

  const migrationsDir = join(repoRoot, 'packages', 'database', 'dist', 'cjs', 'migrations');

  if (dryRun) {
    for (const name of migrationNames) {
      const base = name.endsWith('.js') ? name : `${name}.js`;
      const path = join(migrationsDir, base);
      console.log(`Would run: ${base} (${path})`);
    }
    console.log('Dry run complete. Exiting without touching the database.');
    return;
  }

  const configModule = await import('config');
  const config = configModule.default ?? configModule;
  if (!config?.db) {
    throw new Error(
      'config.db not found. Set NODE_CONFIG_DIR=packages/central-server/config and use a config that has db.',
    );
  }

  // Use require() so we load the CJS build; the ESM build does a directory import Node rejects
  const { openDatabase, closeAllDatabases } = require('@tamanu/database/services/database');
  const { runPreMigration, runPostMigration } = require(
    '@tamanu/database/services/migrations/migrationHooks',
  );

  const log = {
    info: (...a) => console.log('[info]', ...a),
    warn: (...a) => console.warn('[warn]', ...a),
    error: (...a) => console.error('[error]', ...a),
    debug: (...a) => console.log('[debug]', ...a),
  };

  const key = 'performance-test-migrations';
  const scriptStart = performance.now();
  const results = [];

  const store = await openDatabase(key, { ...config.db });
  const { sequelize } = store;
  const queryInterface = sequelize.getQueryInterface();

  try {
    log.info('Running pre-migration steps...');
    await runPreMigration(log, sequelize);
    log.info('Pre-migration steps done.');

    for (const name of migrationNames) {
      const base = name.endsWith('.js') ? name : `${name}.js`;
      const path = join(migrationsDir, base);
      const mod = await import(pathToFileURL(path).href);
      const up = mod.up ?? mod.default?.up;
      if (typeof up !== 'function') {
        console.error(`Missing up() in ${base}`);
        process.exitCode = 1;
        results.push({ name: base, ms: null, ok: false });
        continue;
      }

      const start = performance.now();
      try {
        await sequelize.transaction(async () => {
          await up(queryInterface);
        });
        const ms = Math.round(performance.now() - start);
        results.push({ name: base, ms, ok: true });
        console.log(`\n  → ${base}: ${ms} ms\n`);
      } catch (err) {
        const ms = Math.round(performance.now() - start);
        results.push({ name: base, ms, ok: false });
        console.error(`\n  ✗ ${base}: FAILED after ${ms} ms`, err);
        process.exitCode = 1;
      }
    }

    log.info('Running post-migration steps...');
    await runPostMigration(log, sequelize);
    log.info('Post-migration steps done.');

    const scriptMs = Math.round(performance.now() - scriptStart);
    const migrationTotalMs = results.filter((r) => r.ok && r.ms != null).reduce((s, r) => s + r.ms, 0);

    console.log('\n' + '─'.repeat(60));
    console.log('Performance test summary');
    console.log('─'.repeat(60));
    for (const r of results) {
      if (r.ok && r.ms != null) {
        console.log(`  ${r.name}: ${r.ms} ms`);
      } else if (!r.ok && r.ms != null) {
        console.log(`  ${r.name}: FAILED (${r.ms} ms before error)`);
      } else {
        console.log(`  ${r.name}: skipped (no up())`);
      }
    }
    console.log('─'.repeat(60));
    console.log(`  Migrations total: ${migrationTotalMs} ms`);
    console.log(`  Script wall clock: ${(scriptMs / 1000).toFixed(1)} s`);
    if (results.length > 0 && results.every((r) => r.ok && r.ms != null && r.ms < 500)) {
      console.log(
        '  (Low ms may mean a migration returned early, e.g. facility server or fresh-deployment check.)',
      );
    }
    console.log('─'.repeat(60) + '\n');
  } finally {
    await closeAllDatabases();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
