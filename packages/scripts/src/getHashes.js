const { zip, difference } = require('lodash');
const hashObject = require('object-hash');

const { createMigrationInterface } = require('@tamanu/shared/services/migrations');
const { initDatabase } = require('@tamanu/shared/services/database');
const { MIGRATIONS_DIR } = require('@tamanu/shared/services/migrations');
const { log } = require('@tamanu/shared/services/logging');
const config = require('config');

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
    if (data.length === 0) throw new Error(`table not populated with data: ${table}`);
    hashes[table] = hashObject(data);
  }
  return hashes;
}

async function getColumnsForModel(model) {
  const description = await model.describe();
  return Object.keys(description);
}

if (process.argv[2] === undefined) {
  throw Error("Need migrations info");
}

console.log(process.argv[2]);

(async () => {
  const db = await initDatabase({ testMode: true, ...config.db });
  const umzug = createMigrationInterface(log, db.sequelize);
  const migrationsInfo = JSON.parse(process.argv[2]);
  const hashesList = [];
  for (const { name, upTables } of migrationsInfo) {
    const meta = (await umzug.up({ to: name }))[0];

    if (isMigrationIgnored(meta.path)) continue;

    // collect hash info
    let hashes = await getHashesForTables(db.sequelize, upTables);
    hashesList.push({ name, hashes });
  }
  console.log(JSON.stringify(hashesList));
})();
