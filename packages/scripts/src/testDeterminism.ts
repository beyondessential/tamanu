import { execFile } from 'node:child_process';
import config from 'config';
import { program } from 'commander';
import Umzug from 'umzug';

import { createMigrationInterface } from '@tamanu/database/services/migrations';
import { Sequelize as TamanuSequelize } from '@tamanu/database';
import { initDatabase } from '@tamanu/database/services/database';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { QueryTypes, Sequelize } from 'sequelize';
import { Model } from '@tamanu/database/models/Model';
import { generateFake } from './fake';
import { createHash } from 'node:crypto';

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

async function* pendingMigrationIter(umzug: Umzug) {
  while (true) {
    const next = (await umzug.pending())?.[0]?.file;
    if (!next) break;
    yield next;
  }
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

    const rows = sequelize.query(
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

    const hash = (rows?.[0] as any).hash as string|null;
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
  const umzug = createMigrationInterface(log, sequelize);

  const perMigration: MigrationHashes[] = [];
  for await (const migration of pendingMigrationIter(umzug)) {
    await umzug.up({ migrations: [migration] });
    const tables = await listTables(sequelize);
    const perTable = await hashTables(sequelize, tables);
    const summary = summarise(perTable);
    perMigration.push({ migration, summary, perTable });
  }

  const last = perMigration[perMigration.length - 1];
  return {
    dbName,
    summary: last!.summary,
    perTable: last!.perTable,
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
    const migrationA = a.perMigration[i];
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
    execFile(prog, args, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

const gitCommand = (args: string[]) => runCommand('git', args);

async function isRepoClean(): Promise<boolean> {
  const stdout = await gitCommand(['status', '--porcelain', 'v2']);
  return stdout.length === 0;
}

async function listCommitsSince(limitCommitRef: string): Promise<string[]> {
  const stdout = await gitCommand(['log', '--format', '%H', `${limitCommitRef}^..HEAD`]);
  return stdout.split(/\s+/) ?? [];
}

async function listCommitFiles(commitRef: string): Promise<string[]> {
  const stdout = await gitCommand(['show', '--stat', commitRef]);
  return (stdout.split(/\s+/) ?? [])
    .filter((line) => line.includes(' | '))
    .map((line) => line.split(' | ')[0].trim());
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

  const commits = await listCommitsSince(sinceRef);
  if (commits.length < 2) {
    throw new Error('we need at least two commits to proceed');
  }

  const HEAD = commits[0];

  // find the first migration-touching commit
  let commitBeforeMigration: string | undefined;
  for (const commit of commits) {
    if (await commitTouchesMigrations(commit)) break;
    commitBeforeMigration = commit;
  }

  if (!commitBeforeMigration) {
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
    ...(config as any).db,
    testMode: true,
    name: `determinism-test-${name}`,
  });

  try {
    console.log(`=== Preparation ===`);

    console.log('Switch repo to before migrations to test');
    await gitCommand(['switch', '--detach', commitBeforeMigration]);

    const initDb = dbConfig('init');
    {
      console.log('Create new database', initDb.name);
      await runCommand('dropdb', ['--if-exists', initDb.name]);
      await runCommand('createdb', ['-O', initDb.user, initDb.name]);

      console.log('Migrate database from blank');
      const db = await initDatabase(initDb);
      const sequelize = db.sequelize as TamanuSequelize;
      await sequelize.migrate('up');

      console.log('Fill database with fake data');
      await generateFake(sequelize, dataRounds);

      await sequelize.close();
    }

    console.log('Switch repo to after migrations to test');
    await gitCommand(['switch', '--detach', HEAD]);

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
      const db = await initDatabase(dbConfig);
      const sequelize = db.sequelize as TamanuSequelize;
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
