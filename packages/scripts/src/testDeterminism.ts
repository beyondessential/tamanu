#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { userInfo } from 'node:os';
import { join } from 'node:path';

import type { Sequelize } from '@tamanu/database';
import type { Model } from '@tamanu/database/models/Model';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { QueryTypes } from 'sequelize';
import { runCommand, spawnCommand } from './runCommand';

function warn(message: string) {
  if (process.env.CI) {
    console.log(`::warning ::${message}`);
  } else {
    console.warn(`⚠️ ${message}`);
  }
}

type TableHashes = Map<string, string>;

interface DbHashes {
  dbName: string;
  summary: string;
  perTable: TableHashes;
}

async function listTables(sequelize: Sequelize): Promise<string[]> {
  return (
    (sequelize.modelManager.all as (typeof Model)[])
      // No need for determinism test when data is not shared between central and facility
      .filter(model => model.syncDirection !== SYNC_DIRECTIONS.DO_NOT_SYNC)
      .map(model => {
        const schema = (model as any).options?.schema || 'public';
        return `"${schema}"."${model.tableName}"`;
      })
  );
}

const UNHASHED_COLUMNS = ['created_at', 'updated_at', 'deleted_at', 'updated_at_sync_tick'];
async function hashTables(sequelize: Sequelize, tables: string[]): Promise<TableHashes> {
  await sequelize.query(`
    CREATE FUNCTION determinism_hash_agg_sfunc(text, anyelement)
      RETURNS text
      LANGUAGE sql
      AS
      $$
        -- md5 sucks but is built-in and the types work out
        -- plus we're not doing cryptographic stuff here
        SELECT md5($1 || $2::text)
      $$;

    CREATE AGGREGATE determinism_hash_agg (ORDER BY anyelement) (
      STYPE = text,
      SFUNC = determinism_hash_agg_sfunc,
      INITCOND = ''
    );
  `);

  const hashes: TableHashes = new Map();
  for (const table of tables) {
    await sequelize.query(`CREATE TEMPORARY TABLE determinism_check_table AS TABLE ${table}`);
    for (const column of UNHASHED_COLUMNS) {
      try {
        await sequelize.query(`ALTER TABLE determinism_check_table DROP "${column}"`);
      } catch (_err) {
        /* ignore non-existent unhashed columns */
      }
    }

    // json columns aren't orderable, but jsonb are
    const jsonColumns = await sequelize.query(
      `
      SELECT pg_attribute.attname AS col
      FROM pg_attribute JOIN pg_class ON attrelid = pg_class.oid
      WHERE
        pg_class.relname = 'determinism_check_table' AND
        atttypid = 'json'::regtype::oid AND
        reltype != 0
      `,
      { type: QueryTypes.SELECT },
    );
    for (const { col } of jsonColumns as any[]) {
      await sequelize.query(`ALTER TABLE determinism_check_table ALTER COLUMN "${col}" TYPE jsonb`);
    }

    const rows = await sequelize.query(
      `
        SELECT determinism_hash_agg()
          WITHIN GROUP (ORDER BY determinism_check_table)
          AS hash
        FROM determinism_check_table
        -- ${table}
      `,
      {
        type: QueryTypes.SELECT,
      },
    );
    await sequelize.query('DROP TABLE IF EXISTS determinism_check_table');

    const hash = (rows[0] as any).hash as string | null;
    if (hash?.length) hashes.set(table, hash);
    else warn(`found empty table ${table}`);
  }

  await sequelize.query(`
    DROP AGGREGATE determinism_hash_agg (ORDER BY anyelement);
    DROP FUNCTION determinism_hash_agg_sfunc (text, anyelement);
  `);

  return hashes;
}

function summarise(hashes: TableHashes): string {
  const tables: string[] = [];
  for (const [table, hash] of hashes.entries()) {
    tables.push(`${table}:${hash}`);
  }
  tables.sort();
  const hash = createHash('sha256');
  for (const table of tables) {
    hash.update(table);
  }
  return hash.digest().toString('base64');
}

async function areMigrationsAvailable(dbConfig: any): Promise<boolean> {
  const { initDatabase } = require('@tamanu/database/services/database');
  const { createMigrationInterface } = require('@tamanu/database/services/migrations');

  const db = await initDatabase(dbConfig);
  const sequelize = db.sequelize as Sequelize;

  const umzug = createMigrationInterface(console, sequelize);
  const pending = await umzug.pending();
  await sequelize.close();

  return !!pending.length;
}

async function migrate(dbConfig: any): Promise<void> {
  const script = `
    (async () => {
      const { version } = require('../package.json');
      const { initDatabase } = require('@tamanu/database/services/database');
      const { upgrade } = require('@tamanu/upgrade');

      const { models, sequelize } = await initDatabase(${JSON.stringify(dbConfig)});
      await upgrade({ models, sequelize, serverType: 'facility', toVersion: version });
      await sequelize.close();
    })().catch(err => {
      console.error(err);
      process.exit(1);
    });
  `;
  await spawnCommand('node', ['-e', script]);
}

async function migrateAndHash(dbConfig: any): Promise<DbHashes> {
  await migrate(dbConfig);

  const { initDatabase } = require('@tamanu/database/services/database');
  const db = await initDatabase(dbConfig);
  const sequelize = db.sequelize as Sequelize;

  const tables = await listTables(sequelize);
  const perTable = await hashTables(sequelize, tables);
  const summary = summarise(perTable);

  await sequelize.close();

  return {
    dbName: dbConfig.name,
    summary,
    perTable,
  };
}

function printStepDiff(a: TableHashes, b: TableHashes) {
  for (const [tableName, hashA] of a.entries()) {
    const hashB = b.get(tableName);
    if (!hashB) {
      console.log(`table ${tableName}: deleted`);
    } else if (hashA !== hashB) {
      console.log(`table ${tableName}: mismatch! ${hashA} != ${hashB}`);
    }
  }

  for (const tableInB of b.keys()) {
    if (!a.has(tableInB)) {
      console.log(`table ${tableInB}: created`);
    }
  }
}

function printDiff(a: DbHashes, b: DbHashes) {
  console.log(`${a.dbName} -> ${b.dbName}`);
  console.log(`${a.summary} -> ${b.summary}`);
  console.log();
  if (a.summary !== b.summary) {
    printStepDiff(a.perTable, b.perTable);
    console.log();
  }
}

async function gitCommand(args: string[]): Promise<string> {
  return runCommand('git', args);
}

async function isRepoClean(): Promise<boolean> {
  const stdout = await gitCommand(['status', '--porcelain=v2']);
  return stdout.length === 0;
}

async function listCommitsSince(limitCommitRef: string): Promise<string[]> {
  const stdout = await gitCommand(['log', '--format=%H', `${limitCommitRef}^..HEAD`]);
  return (stdout.split(/\s+/) ?? []).reverse();
}

async function listCommitFiles(commitRef: string): Promise<string[]> {
  const stdout = await gitCommand(['diff-tree', '--no-commit-id', '--name-only', '-r', commitRef]);
  return (stdout.split(/\s+/) ?? []).map(line => line.trim());
}

async function commitTouchesMigrations(commitRef: string): Promise<boolean> {
  const filesChanged = await listCommitFiles(commitRef);
  return filesChanged.some(file =>
    file.replaceAll('\\', '/').includes('packages/database/src/migrations'),
  );
}

async function generateFake(database: string, rounds: number): Promise<void> {
  const script = join(__dirname, 'fake.js');
  return spawnCommand('node', [script, '--database', database, '--rounds', rounds.toString()]);
}

(async () => {
  const { program } = await import('commander');
  const opts = program
    .requiredOption('--since-ref <string>', "Don't look further back than this commit/ref")
    .option(
      '--check-precondition',
      'Only check whether we can run (codes: 0=go, 1=error, 2=unneeded)',
    )
    .option(
      '--skip-db-check',
      'During a precondition check, skip checking the database (useful if the database is not ready yet)',
    )
    .option(
      '--skip-env-check',
      'During a precondition check, skip checking the environment (used in CI)',
    )
    .option('--test-rounds <number>', 'How many times to apply migrations during test', '10')
    .option('--data-rounds <number>', 'How much data to fill database with', '100')
    .parse()
    .opts();

  if (!opts.checkPrecondition && (opts.skipDbCheck || opts.skipEnvCheck)) {
    throw new Error('--skip-*-check cannot be used without --check-precondition');
  }

  /* match (checkPrecondition, skipEnvCheck, NODE_CONFIG_DIR.is_set()) {
    (true, true, false) => skip,
    (false, true, _) => caught above,
    (_, _, false) => throw,
    _ => skip
  } */
  if (!process.env.NODE_CONFIG_DIR && !opts.skipEnvCheck) {
    throw new Error('NODE_CONFIG_DIR must be set, to select the target server');
  }

  if (!(await isRepoClean())) {
    throw new Error('repo is not clean! abort');
  }

  const currentBranch = await gitCommand(['branch', '--show-current']);
  if (!currentBranch) {
    throw new Error('must be on a branch! abort');
  }

  const dataRounds = parseInt(opts.dataRounds, 10);
  if (dataRounds < 1) {
    throw new Error('--data-rounds must be at least 1');
  }

  const testRounds = parseInt(opts.testRounds, 10);
  if (testRounds < 1) {
    throw new Error('--test-rounds must be at least 1');
  }

  const commits = await listCommitsSince(opts.sinceRef);
  if (commits.length < 2) {
    throw new Error('we need at least two commits to proceed');
  }

  // commit list is from oldest to newest, so HEAD is at the bottom
  const HEAD = commits[commits.length - 1]!;

  let commitBeforeMigration: string = commits[0]!;

  // find the first migration-touching commit
  let firstMigrationCommit: string | undefined;
  for (const commit of commits.slice(1)) {
    if (await commitTouchesMigrations(commit)) {
      firstMigrationCommit = commit;
      break;
    }
    commitBeforeMigration = commit;
  }

  if (!firstMigrationCommit) {
    console.log('There is nothing touching migrations here, so there is nothing to check!');
    if (opts.checkPrecondition) process.exit(2);
    return;
  }

  console.log('The first commit to touch a migration is', firstMigrationCommit);
  console.log('Starting migration testing from commit', commitBeforeMigration);

  // so now we have:
  // - commitBeforeMigration: the last commit before we touch migrations
  // - HEAD: where we're at
  //
  // we're going to go to commitBeforeMigration, build the database to this
  // point, fill it with data, hash the tables (1), then move back to HEAD,
  // run all the migrations, hash the tables (2), and finally compare 1 & 2

  if (opts.skipDbCheck) {
    console.log('✔ Good to go!');
    return;
  }

  const { default: config } = await import('config');
  const { initDatabase } = require('@tamanu/database/services/database');

  const dbConfig = (name: string) => ({
    user: userInfo().username,
    ...(config as any).db,
    testMode: true,
    name: `determinism-test-${name}`,
  });

  if (opts.checkPrecondition) {
    const initDb = dbConfig('init');
    console.log('Create new database', initDb.name);
    await runCommand('dropdb', ['--if-exists', initDb.name]);
    await runCommand('createdb', ['-O', initDb.user, initDb.name]);
    const db = await initDatabase(initDb);
    await db.sequelize.close();

    console.log('✔ Good to go!');
    return;
  }

  try {
    console.log(`=== Preparation ===`);

    console.log('Switch repo to before migrations to test', commitBeforeMigration);
    await gitCommand(['switch', '--discard-changes', '--detach', commitBeforeMigration]);
    await runCommand('npm', ['install']);
    await runCommand('npm', ['run', 'build-shared']);
    await runCommand('npm', ['run', '--workspace', 'scripts', 'build']);

    const initDb = dbConfig('init');
    {
      console.log('Create new database', initDb.name);
      await runCommand('dropdb', ['--if-exists', initDb.name]);
      await runCommand('createdb', ['-O', initDb.user, initDb.name]);

      console.log('Migrate database from blank');
      await migrate(initDb);

      await generateFake(initDb.name, dataRounds);
    }

    console.log('Switch repo to after migrations to test', HEAD);
    await gitCommand(['switch', '--discard-changes', '--detach', HEAD]);
    await runCommand('npm', ['install']);
    await runCommand('npm', ['run', 'build-shared']);

    console.log('Running', testRounds + 1, 'rounds of migrations');
    let previousHashes: DbHashes | undefined;
    for (const [n] of Array(testRounds + 1)
      .fill(0)
      .entries()) {
      if (n > 0) console.log(`=== Test round ${n} ===`);

      const copyDb = dbConfig(`${n}`);
      console.log('Create test database', copyDb.name);
      await runCommand('dropdb', ['--if-exists', copyDb.name]);
      await runCommand('createdb', ['-O', copyDb.user, '-T', initDb.name, copyDb.name]);

      if (!(await areMigrationsAvailable(copyDb))) {
        console.log('❎ Found some migration commits, but no actual migrations in the end state.');
        break;
      }

      console.log('Migrate and hash the database');
      const hashes = await migrateAndHash(copyDb);

      console.log('Post-migrations overall hash:', hashes.summary);
      if (previousHashes && hashes.summary !== previousHashes.summary) {
        console.log('!!! Found non-determinism !!!');
        printDiff(previousHashes, hashes);
        console.log(
          '❌ See this slab page for potential solutions:',
          'https://beyond-essential.slab.com/posts/migration-determinism-testing-nwksh8cf',
        );
        throw new Error('failed determinism check');
      }

      previousHashes = hashes;
    }
  } finally {
    console.log();
    console.log('Resetting repo to', currentBranch);
    await gitCommand(['switch', '--discard-changes', currentBranch]);
    console.log();
  }

  console.log('🎉 Determinism check passed!');
})();
