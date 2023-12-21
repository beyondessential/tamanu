import { QueryTypes } from 'sequelize';
import { injectReplacements } from 'sequelize/lib/utils/sql';
import { uniq, sortedUniq, difference } from 'lodash';
import { astVisitor, parseFirst } from 'pgsql-ast-parser';
import hashObject from 'object-hash';

import { initDatabase } from '@tamanu/shared/services/database';

// gives you a db + a `flushQueries` function that returns all queries since it was last called
export async function initQueryCollectingDb() {
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
  const db = await initDatabase({ testMode: true, loggingOverride });
  return { db, flushQueries };
}

// collects name, queries, and affected tables for all migrations back to `earliestMigration`
export async function collectInfoForMigrations(umzug, flushQueries, earliestMigration) {
  await resetToMigration(umzug, earliestMigration);

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

export async function resetToMigration(umzug, to) {
  if ((await umzug.executed()).map(m => m.file).includes(to)) {
    await umzug.down({ to }); // migrate down if we were too far up
  }
  await umzug.up({ to }); // migrate up again
}

// retrieves table names from a list of SQL queries
export function tableNamesFromQueries(queries) {
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

const UNHASHED_TABLES = ['SequelizeMeta', 'pg_attribute', 'pg_class', 'pg_index', 'tables'];
const UNHASHED_COLUMNS = ['created_at', 'updated_at', 'deleted_at', 'updated_at_sync_tick'];
const ORDER_BY_OVERRIDE = {};

export async function getHashesForTables(sequelize, tables) {
  const hashes = {};
  for (const table of tables) {
    // exclude postgres tables, sync info, etc.
    if (UNHASHED_TABLES.includes(table)) continue;

    // get columns
    const allColumns = await getColumnsForTable(sequelize, table);
    const columns = difference(allColumns, UNHASHED_COLUMNS).map(c => {
      if (typeof c !== 'string') throw new Error('column name must be a string');
      if (c.includes('"')) throw new Error("shouldn't have a double quote in column name");
      return `"${c}"`;
    });

    // find all data
    const orderBy = ORDER_BY_OVERRIDE[table] || 'id';
    const query = `SELECT ${columns.join(', ')} FROM "${table}" ORDER BY "${orderBy}"`; // yes, this query is unsafe, don't copy it in production code
    const data = await sequelize.query(query, { raw: true, type: QueryTypes.SELECT });
    if (data.length === 0) throw new Error(`table not populated with data: ${table}`);
    hashes[table] = hashObject(data);
  }
}

export async function getColumnsForTable(sequelize, tableName) {
  const description = await sequelize.getQueryInterface().describeTable(tableName);
  return Object.keys(description);
}
