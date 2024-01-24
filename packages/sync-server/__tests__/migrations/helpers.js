import { QueryTypes } from 'sequelize';
import { injectReplacements } from 'sequelize/lib/utils/sql';
import { uniq, sortedUniq, difference } from 'lodash';
import { astVisitor, parseFirst } from 'pgsql-ast-parser';
import hashObject from 'object-hash';

import { initDatabase } from '@tamanu/shared/services/database';
import { MIGRATIONS_DIR } from '@tamanu/shared/services/migrations';

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
  const pending = await umzug.pending();
  const earliestMigrationIndex = pending.findIndex(m => m.file === earliestMigration);
  await resetToMigration(umzug, pending[earliestMigrationIndex - 1].file);

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

export function isMigrationIgnored(name) {
  const migration = require(`${MIGRATIONS_DIR}/${name}`);
  return !!migration.NON_DETERMINISTIC;
}

const UNHASHED_TABLES = ['SequelizeMeta', 'columns', 'key_column_usage', 'pg_attribute', 'pg_class', 'pg_description',
  'pg_enum', 'pg_statio_all_tables', 'pg_type', 'pg_index', 'table_constraints', 'tables'];
const UNHASHED_COLUMNS = ['created_at', 'updated_at', 'deleted_at', 'updated_at_sync_tick'];
const ORDER_BY_OVERRIDE = {};

export async function getHashesForTables(sequelize, tables) {
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
    if (data.length === 0) throw new Error(`table not populated with data: ${table}`);
    hashes[table] = hashObject(data);
  }
  return hashes;
}

export async function getColumnsForModel(model) {
  const description = await model.describe();
  return Object.keys(description);
}
