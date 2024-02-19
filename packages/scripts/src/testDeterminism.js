const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { isEqual, zip, difference, uniq, sortedUniq } = require('lodash');
const { injectReplacements } = require('sequelize/lib/utils/sql');
const { program } = require('commander');
const hashObject = require('object-hash');
const { astVisitor, parseFirst } = require('pgsql-ast-parser');
const { createMigrationInterface } = require('@tamanu/shared/services/migrations');
const { initDatabase } = require('@tamanu/shared/services/database');
const { log } = require('@tamanu/shared/services/logging');
const config = require('config');

// retrieves table names from a list of SQL queries
function tableNamesFromQueries(queries) {
  const results = [];
  for (const query of queries) {
    results.push(...tableNamesFromQuery(query));
  }
  return sortedUniq(results.sort());
}

// retrieves table names from a single SQL query
function tableNamesFromQuery(query) {
  const tables = new Set();
  const visitor = astVisitor(() => ({
    tableRef: t => tables.add(t.name),
  }));
  try {
    visitor.statement(parseFirst(query));
  } catch (e) {
    // intentionally ignore unparseable queries, since they're probably functions
    // for debugging, uncomment:
    // console.error(e, query);
  }
  return tables.values();
}

// gives you a db + a `flushQueries` function that returns all queries since it was last called
async function initQueryCollectingDb(dbConfig) {
  // query log collection
  let loggedQueries = [];
  const loggingOverride = (query, opts) => {
    loggedQueries.push([query, opts]);
  };
  const flushQueries = () => {
    const queries = loggedQueries;
    loggedQueries = [];
    // we do the processing here because otherwise sequelize will call `loggingOverride` before `db`
    // has been initialised, and we need to read `db.sequelize.dialect`
    return queries.map(([rawQuery, { replacements }]) => {
      const queryWithoutReplacements = rawQuery.replace(/^Executing \([^)]+\): /, '');
      const query = injectReplacements(
        queryWithoutReplacements,
        db.sequelize.dialect,
        replacements,
      );
      return query;
    });
  };

  // init db and migrations
  const db = await initDatabase({ loggingOverride, ...dbConfig });
  return { db, flushQueries };
}

// collects name, queries, and affected tables for all migrations not run yet
async function collectInfoForMigrations(umzug, flushQueries) {
  // collect query info
  const migrationsInfo = [];
  const getNextPending = async () => (await umzug.pending())[0]?.file;
  let nextPending = await getNextPending();
  while (nextPending) {
    // empty query buffer
    flushQueries();

    // collect query info for each migration
    await umzug.up({ migrations: [nextPending] });
    const up = flushQueries();
    await umzug.down({ migrations: [nextPending] });
    const down = flushQueries();
    migrationsInfo.push({ name: nextPending, up, down });

    // prepare for next loop
    await umzug.up({ migrations: [nextPending] });
    nextPending = await getNextPending();
  }

  // extract table names
  for (const migrationInfo of migrationsInfo) {
    const { up, down } = migrationInfo;
    migrationInfo.upTables = tableNamesFromQueries(up);
    migrationInfo.downTables = tableNamesFromQueries(down);
    migrationInfo.tables = uniq([...migrationInfo.upTables, ...migrationInfo.downTables]);
  }
  return migrationsInfo;
}

function isMigrationIgnored(path) {
  const module = require(path);
  return !!module.NON_DETERMINISTIC;
}

const UNHASHED_TABLES = ['SequelizeMeta', 'columns', 'key_column_usage', 'pg_attribute', 'pg_class', 'pg_description',
  'pg_enum', 'pg_statio_all_tables', 'pg_type', 'pg_index', 'table_constraints', 'tables'];
const UNHASHED_COLUMNS = ['created_at', 'updated_at', 'deleted_at', 'updated_at_sync_tick'];
const ORDER_BY_OVERRIDE = {};

async function getHashesForTables(sequelize, tables) {
  const hashes = {};
  for (const table of tables) {
    // exclude postgres tables, sync info, etc.
    if (UNHASHED_TABLES.includes(table)) continue;

    const model = sequelize.modelManager.findModel(m => m.tableName === table);

    // get columns
    const allColumns = await getColumnsForModel(model);
    const columns = difference(allColumns, UNHASHED_COLUMNS);
    columns.forEach(c => {
      if (typeof c !== 'string') throw new Error('column name must be a string');
      if (c.includes('"')) throw new Error("shouldn't have a double quote in column name");
    });

    // find all data
    const orderBy = ORDER_BY_OVERRIDE[table] || 'id';
    const data = (await model.findAll({
      attributes: columns,
      order: [[orderBy, 'DESC']]
    })).map(d => d.dataValues);
    if (data.length === 0) throw new Error(`table not populated with data: ${table}. ` +
      'See the note "How to resolve an error in Test for Determinism" to resolve this.');
    hashes[table] = hashObject(data);
  }
  return hashes;
}

async function getColumnsForModel(model) {
  const description = await model.describe();
  return Object.keys(description);
}

async function run(command, args) {
  const proc = spawn(command, args);
  proc.stdout.on('data', d => console.log(d.toString()));
  proc.stderr.on('data', d => console.error(d.toString()));
  const [code] = await once(proc, "exit");
  if (code !== 0) {
    console.error(`${command} failed with ${code}.`);
    process.exit(1);
  }
}

program
  .requiredOption('-d, --dump-path <string>', 'An absolute path to a pg dump file');

program.parse();

async function getHashesForDb(migrationsInfo) {
  await run("pg_restore", ["--create", "--clean", "-d", "postgres", program.opts().dumpPath]);
  const db = await initDatabase({ testMode: true, ...config.db });
  const umzug = createMigrationInterface(log, db.sequelize);

  const hashesList = [];
  for (const { name, upTables } of migrationsInfo) {
    const meta = (await umzug.up({ to: name }))[0];

    if (isMigrationIgnored(meta.path)) continue;

    // collect hash info
    let hashes = await getHashesForTables(db.sequelize, upTables);
    hashesList.push({ name, hashes });
  }

  await db.sequelize.close();
  return hashesList;
}

(async () => {
  // The `setup-postgres-for-one-package` script makes a db so reuse that.
  await run("pg_restore", ["-d", "fake", program.opts().dumpPath]);
  const qc = await initQueryCollectingDb({ testMode: true, ...config.db });
  const { flushQueries } = qc;
  const db = qc.db;

  // collect info about which migrations touch which tables
  const umzug = createMigrationInterface(log, db.sequelize);
  const migrationsInfo = await collectInfoForMigrations(umzug, flushQueries);

  await db.sequelize.close();

  const hashesList1 = await getHashesForDb(migrationsInfo);
  const hashesList2 = await getHashesForDb(migrationsInfo);

  for (const [hashes1, hashes2] of zip(hashesList1, hashesList2)) {
    if (!isEqual(hashes1.hashes, hashes2.hashes)) {
      console.log(`The migration ${hashes1.name} is not deterministic`);
      process.exit(1);
    }
  }
  console.log(`The migrations are deterministic. Tested: ${hashesList1.map(h => h.name)}`);
})();
