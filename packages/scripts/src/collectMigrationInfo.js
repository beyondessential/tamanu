const { injectReplacements } = require('sequelize/lib/utils/sql');
const { uniq, sortedUniq } = require('lodash');
const { astVisitor, parseFirst } = require('pgsql-ast-parser');
const { createMigrationInterface } = require('@tamanu/shared/services/migrations');
const { log } = require('@tamanu/shared/services/logging');
const { initDatabase } = require('@tamanu/shared/services/database');
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
async function initQueryCollectingDb() {
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
    const db = await initDatabase({ testMode: true, loggingOverride, ...config.db });
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

(async () => {
    const qc = await initQueryCollectingDb();
    const { flushQueries } = qc;
    const db = qc.db;

    // collect info about which migrations touch which tables
    const umzug = createMigrationInterface(log, db.sequelize);
    const migrationsInfo = await collectInfoForMigrations(umzug, flushQueries);

    console.log(JSON.stringify(migrationsInfo));
    return;
})();
