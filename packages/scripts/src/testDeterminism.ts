import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { userInfo } from 'node:os';

import config from 'config';
import { program } from 'commander';

import type { Sequelize } from '@tamanu/database';
import type { Model } from '@tamanu/database/models/Model';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { QueryTypes } from 'sequelize';
import { generateFake } from './fake.js';

const { initDatabase } = require('@tamanu/database/services/database');
const { createMigrationInterface } = require('@tamanu/database/services/migrations');

type TableHashes = Map<string, string>;

interface MigrationHashes {
  migration: string;
  summary: string;
  perTable: TableHashes;
}

interface DbHashes extends Omit<MigrationHashes, 'migration'> {
  dbName: string;
  perMigration: MigrationHashes[];
}

async function listTables(sequelize: Sequelize): Promise<string[]> {
  return (
    (sequelize.modelManager.all as (typeof Model)[])
      // No need for determinism test when data is not shared between central and facility
      .filter((model) => model.syncDirection !== SYNC_DIRECTIONS.DO_NOT_SYNC)
      .map((model) => model.tableName)
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
    await sequelize.query('CREATE TEMPORARY TABLE determinism_check_table AS TABLE $table', {
      bind: { table },
    });
    for (const column of UNHASHED_COLUMNS) {
      try {
        await sequelize.query('ALTER TABLE determinism_check_table DROP $column', {
          bind: { column },
        });
      } catch (_err) {
        /* ignore non-existent unhashed columns */
      }
    }

    const rows = await sequelize.query(
      `
        SELECT determinism_hash_agg() AS hash
        WITHIN GROUP (ORDER BY determinism_check_table)
        FROM determinism_check_table
      `,
      {
        type: QueryTypes.SELECT,
      },
    );
    await sequelize.query('DROP TABLE IF EXISTS determinism_check_table');

    const hash = (rows[0] as any).hash as string | null;
    if (hash?.length) hashes.set(table, hash);
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

async function migrateAndHash(dbName: string, sequelize: Sequelize): Promise<DbHashes> {
  const umzug = createMigrationInterface(() => {}, sequelize);
  const pending = await umzug.pending();

  if (!pending.length) {
    throw new Error('no migrations found');
  }

  const perMigration: MigrationHashes[] = [];
  for await (const migration of pending) {
    await umzug.up({ migrations: [migration] });
    const tables = await listTables(sequelize);
    const perTable = await hashTables(sequelize, tables);
    const summary = summarise(perTable);
    perMigration.push({ migration, summary, perTable });
  }

  const last = perMigration[perMigration.length - 1];
  return {
    dbName,
    summary: last?.summary!,
    perTable: last?.perTable!,
    perMigration,
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
  console.log();

  const orderA = a.perMigration.map((m) => m.migration).join(', ');
  const orderB = b.perMigration.map((m) => m.migration).join(', ');
  if (orderA !== orderB) {
    console.log('migrations did not apply in the same order!');
    console.log(`${a.dbName}: ${orderA}`);
    console.log(`${b.dbName}: ${orderB}`);
    console.log();
    return;
  }

  for (const [i, migrationB] of b.perMigration.entries()) {
    const migrationA = a.perMigration[i]!;
    console.log(`--- ${migrationA.migration} ---`);
    console.log(`${migrationA.summary} -> ${migrationB.summary}`);
    if (migrationA.summary !== migrationB.summary) {
      printStepDiff(migrationA.perTable, migrationB.perTable);
      console.log();
    }
  }
}

function runCommand(prog: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('$', prog, ...args);
    execFile(prog, args, (error, stdout, stderr) => {
      if (error) {
        console.log(stdout);
        console.error(stderr);
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
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
  return (stdout.split(/\s+/) ?? []).map((line) => line.trim());
}

async function commitTouchesMigrations(commitRef: string): Promise<boolean> {
  const filesChanged = await listCommitFiles(commitRef);
  return filesChanged.some((file) =>
    file.replaceAll('\\', '/').includes('packages/database/src/migrations'),
  );
}

(async () => {
  if (!(await isRepoClean())) {
    throw new Error('repo is not clean! abort');
  }

  const currentBranch = await gitCommand(['branch', '--show-current']);
  if (!currentBranch) {
    throw new Error('must be on a branch! abort');
  }

  const { dataRounds, sinceRef, testRounds } = program
    .requiredOption('--since-ref <string>', "Don't look further back than this commit/ref")
    .option('--test-rounds <number>', 'How many times to apply migrations during test', '3')
    .option('--data-rounds <number>', 'How much data to fill database with', '10')
    .parse()
    .opts();

  if (dataRounds < 1) {
    throw new Error('--data-rounds must be at least 1');
  }

  if (testRounds < 1) {
    throw new Error('--test-rounds must be at least 1');
  }

  const commits = await listCommitsSince(sinceRef);
  if (commits.length < 2) {
    throw new Error('we need at least two commits to proceed');
  }

  // commit list is from oldest to newest, so HEAD is at the bottom
  const HEAD = commits[commits.length - 1]!;

  // find the first migration-touching commit
  let commitBeforeMigration: string | undefined;
  let firstMigrationCommit: string | undefined;
  for (const commit of commits) {
    if (await commitTouchesMigrations(commit)) {
      firstMigrationCommit = commit;
      break;
    }
    commitBeforeMigration = commit;
  }

  if (!commitBeforeMigration) {
    console.log('Bug (this is to appease typescript)');
    return;
  }

  if (!firstMigrationCommit) {
    console.log('There is nothing touching migrations here, so there is nothing to check!');
    return;
  }

  console.log('Starting migration testing from commit', commitBeforeMigration);

  // so now we have:
  // - commitBeforeMigration: the last commit before we touch migrations
  // - HEAD: where we're at
  //
  // we're going to go to commitBeforeMigration, build the database to this
  // point, fill it with data, hash the tables (1), then move back to HEAD,
  // run all the migrations, hash the tables (2), and finally compare 1 & 2

  const dbConfig = (name: string) => ({
    user: userInfo().username,
    ...(config as any).db,
    testMode: true,
    name: `determinism-test-${name}`,
  });

  try {
    console.log(`=== Preparation ===`);

    console.log('Switch repo to before migrations to test', commitBeforeMigration);
    await gitCommand(['switch', '--detach', commitBeforeMigration]);
    await runCommand('npm', ['run', '--workspace', '@tamanu/database', 'build']);

    const initDb = dbConfig('init');
    {
      console.log('Create new database', initDb.name);
      await runCommand('dropdb', ['--if-exists', initDb.name]);
      await runCommand('createdb', ['-O', initDb.user, initDb.name]);

      console.log('Migrate database from blank');
      const db = await initDatabase(initDb);
      const sequelize = db.sequelize as Sequelize;
      await sequelize.migrate('up');

      console.log('Switch repo to after migrations to test', HEAD);
      await gitCommand(['switch', '--detach', HEAD]);
      await runCommand('npm', ['run', '--workspace', '@tamanu/database', 'build']);

      console.log('Fill database with fake data', dataRounds, 'rounds');
      await generateFake(sequelize, dataRounds);

      await sequelize.close();
    }

    let previousHashes: DbHashes | undefined;
    for (const [n] of Array(testRounds + 1)
      .fill(0)
      .entries()) {
      if (n > 0) console.log(`=== Test round ${n} ===`);

      const copyDb = dbConfig(`${n}`);
      console.log('Create test database', copyDb.name);
      await runCommand('dropdb', ['--if-exists', copyDb.name]);
      await runCommand('createdb', ['-O', copyDb.user, '-T', initDb.name, copyDb.name]);

      console.log('Migrate and hash the database');
      const db = await initDatabase(copyDb);
      const sequelize = db.sequelize as Sequelize;
      const hashes = await migrateAndHash(copyDb.name, sequelize);
      await sequelize.close();

      console.log('Post-migrations overall hash:', hashes.summary);
      if (previousHashes && hashes.summary !== previousHashes.summary) {
        console.log('!!! Found non-determinism !!!');
        printDiff(previousHashes, hashes);
        throw new Error(
          'failed determinism check. ' +
            'See this slab page for potential solutions:' +
            'https://beyond-essential.slab.com/posts/how-to-resolve-an-error-in-test-for-determinism-nwksh8cf',
        );
      }

      previousHashes = hashes;
    }
  } finally {
    console.log('Resetting repo to', currentBranch);
    await gitCommand(['switch', currentBranch]);
  }
})();
