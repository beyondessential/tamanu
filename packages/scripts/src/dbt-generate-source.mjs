#!/usr/bin/env node

// TODO:
// - [x] read a list of tables and clumns from existing `database/model`
// - [ ] If the yml file exists but the table schema/name within doesn't match, discard the existing and create a new file.

process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
const { default: config } = await import('config');
import fs from 'node:fs/promises';
import inflection from 'inflection';
import path from 'node:path';
import pg from 'pg';
import { program } from 'commander';
import YAML from 'yaml';
import _ from 'lodash';

async function readTablesFromFile(schemaName) {
  const schemaPath = path.join(modelRoot, schemaName);
  const tablePromises = (await fs.readdir(schemaPath))
    .filter(tablePath => tablePath.endsWith('.yml'))
    .sort()
    .map(async tablePath => {
      const table = await fs.readFile(path.join(schemaPath, tablePath), { encoding: 'utf-8' });
      // TODO: detect incorrect schema names and report
      return YAML.parse(table).sources[0].tables[0];
    });
  return await Promise.all(tablePromises);
}

async function getSchemas(client) {
  return (
    await client.query(
      `SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name not similar to 'pg%|information_schema|sync_snapshots|reporting'
      ORDER BY schema_name`,
    )
  ).rows.map(table => table.schema_name);
}

async function getTablesInSchema(client, schemaName) {
  return (
    await client.query(
      `SELECT DISTINCT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
      ORDER BY table_name`,
      [schemaName],
    )
  ).rows.map(table => table.table_name);
}

async function getColumnsInRelation(client, schemaName, tableName) {
  return (
    await client.query(
      `SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = $1 and table_name = $2`,
      [schemaName, tableName],
    )
  ).rows;
}

async function getConstraintsForColumn(schemaName, tableName, columnName) {
  return (
    await client.query(
      `SELECT constraint_type
      FROM information_schema.table_constraints NATURAL JOIN information_schema.constraint_column_usage
      WHERE table_schema = $1 and table_name = $2 and column_name = $3`,
      [schemaName, tableName, columnName],
    )
  ).rows;
}

async function readTablesFromDB(client, schemaName) {
  const tablePromises = (await getTablesInSchema(client, schemaName)).map(async table => {
    return {
      name: table,
      columns: (await getColumnsInRelation(client, schemaName, table)).map(column => ({
        name: column.column_name,
        data_type: column.data_type,
        is_nullable: column.is_nullable === 'YES' ? true : false,
      })),
    };
  });
  return await Promise.all(tablePromises);
}

async function generateDataTests(schemaName, tableName, column) {
  const data_tests = [];
  const isUnique = (await getConstraintsForColumn(schemaName, tableName, column.name)).some(
    c => c.constraint_type === 'UNIQUE' || c.constraint_type === 'PRIMARY KEY',
  );
  if (isUnique) data_tests.push('unique');
  if (!column.is_nullable) data_tests.push('not_null');
  return data_tests.length === 0 ? undefined : data_tests;
}

async function generateColumnModel(schemaName, tableName, column) {
  return {
    name: column.name,
    // TODO: get numbers for data type from Postgres
    data_type: column.data_type,
    description: `{{ doc('${tableName}__${column.name}') }}`,
    data_tests: await generateDataTests(schemaName, tableName, column),
  };
}

function generateColumnDoc(tableName, column) {
  return `{% docs ${tableName}__${column.name} %}
TODO
{% enddocs %}`;
}

async function generateTableModel(schemaName, table) {
  return {
    version: 2,
    sources: [
      {
        name: 'tamanu',
        schema: schemaName,
        description: 'TODO',
        __generator: { js_class: inflection.classify(table.name) },
        tables: [
          {
            name: table.name,
            description: `{{ doc('table__${table.name}') }}`,
            tags: [],
            columns: await Promise.all(
              table.columns.map(c => generateColumnModel(schemaName, table.name, c)),
            ),
          },
        ],
      },
    ],
  };
}

function generateTableDoc(table) {
  return `{% docs table__${table.name} %}
TODO
{% enddocs %}

${table.columns.map(c => generateColumnDoc(table.name, c)).join('\n\n')}`;
}

async function fillMissingDoc(schemaName, table) {
  let file;
  try {
    file = await fs.open(path.join(modelRoot, schemaName, `${table.name}.md`), 'wx');
    await file.write(generateTableDoc(table));
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  } finally {
    await file?.close();
  }
}

async function handleDataTypeChange(tableName, existingColumn, newColumn) {
  // TODO: For columns that have changed type, change the data_type in the model file.
  // are we checking changes in constrains (UNIQUE and NONNULL) for data_tests?
  console.log(
    `${existingColumn.data_type} vs ${newColumn.data_type} in ${existingColumn.name} --- ${tableName}`,
  );
}

async function handleRemovedColumn(tableName, column) {
  console.log(`removed ${column.name} in ${tableName}`);
  // TODO: For column that are missing in the database but do exist in the model file, delete the section in the model file and markdown file and print a warning.
}

async function handleMissingColumn(tableName, column) {
  // TODO: For every missing column, add an entry to the model and markdown file:
  // nicely edit markdown? It's not really a markdown but a bunch of Jinja template
  console.log(`missing ${column.name} in ${tableName}`);
}

async function handleRemovedTable(schemaName, table) {
  const tablePath = path.join(modelRoot, schemaName, table.name);
  await Promise.all([fs.rm(tablePath + '.yml'), fs.rm(tablePath + '.md', { force: true })]);
  console.warn(`removed ${table.name}`);
}

async function handleMissingTable(schemaName, table) {
  const genModelPromise = (async () => {
    const model = await generateTableModel(schemaName, table);
    await fs.writeFile(
      path.join(modelRoot, schemaName, `${table.name}.yml`),
      YAML.stringify(model),
    );
  })();
  const docPromise = fillMissingDoc(schemaName, table);
  await Promise.all([genModelPromise, docPromise]);
}

async function handleColumns(tableName, existingColumns, newColumns) {
  // This is expensive yet the most straightforward implementation.
  // Algorithms that rely on sorted lists are out because we want preserve the original order of columns.
  // May be able to use Map, but it doesn't have convinient set operations.
  const removedPromises = _.differenceBy(existingColumns, newColumns, 'name').map(column =>
    handleRemovedColumn(tableName, column),
  );
  const missingPromises = _.differenceBy(newColumns, existingColumns, 'name').map(column =>
    handleMissingColumn(tableName, column),
  );

  // TODO:
  _.intersectionBy(existingColumns, newColumns, 'name').map(async existingColumn => {
    const newColumn = newColumns.find(c => c.name === existingColumn.name);
    if (existingColumn.data_type.toLowerCase() === newColumn.data_type.toLowerCase()) return;

    await handleDataTypeChange(tableName, existingColumn, newColumn);
  });
}

async function handleTables(dbName, schemaName, existingTables, newTables) {
  const removedPromises = _.differenceBy(existingTables, newTables, 'name').map(table =>
    handleRemovedTable(schemaName, table),
  );
  const missingPromises = _.differenceBy(newTables, existingTables, 'name').map(table =>
    handleMissingTable(schemaName, table),
  );

  const existingPromises = _.intersectionBy(existingTables, newTables, 'name').map(
    async existingTable => {
      const newTable = newTables.find(t => t.name === existingTable.name);
      // await fillMissingDoc(schemaName, newTable);
      await handleColumns(existingTable.name, existingTable.columns, newTable.columns);
    },
  );
  await Promise.all([...removedPromises, ...missingPromises, ...existingPromises]);
}

async function generateSource({ host, port, name: database, username, password }, packageName) {
  console.log('Connecting to database for', packageName);
  const client = new pg.Client({ host, port, user: username, database, password });
  try {
    await client.connect();
  } catch (err) {
    console.error(err);
    if (opts.failOnMissingConfig) {
      throw `Invalid database config for ${packageName}, cannot proceed.`;
    }

    return;
  }

  console.log('Generating database models for', packageName);
  const tasks = (await getSchemas(client)).map(async schemaName => {
    const schemaPath = path.join('database/model', packageName, schemaName);
    await fs.mkdir(schemaPath, { recursive: true });
    const tasks = (await getTablesInSchema(client, schemaName)).map(async table => {
      const sources = {
        version: 2,
        sources: [
          {
            name: schemaName,
            database: database.toLowerCase(),
            tables: [
              {
                name: table,
                columns: (await getColumnsInRelation(client, schemaName, table)).map(column => ({
                  name: column.column_name,
                  data_type: column.data_type,
                })),
              },
            ],
          },
        ],
      };
      await fs.writeFile(path.join(schemaPath, `${table}.yml`), YAML.stringify(sources));
    });
    await Promise.all(tasks);
  });
  await Promise.all(tasks);
  await client.end();
}

async function run(packageName, opts) {
  const serverConfig = config.util.loadFileConfigs(path.join('packages', packageName, 'config'));
  const db = config.util.extendDeep(serverConfig.db, config.db); // merge with NODE_CONFIG
  await generateSource(db, packageName, opts);
}

// program.description(`Generates a Source model in dbt.
// This reads Postgres database based on the config files. The search path is \`packages/<server-name>/config\`. \
// You can override the config for both by supplying \`NODE_CONFIG\` or the \`config\` directory at the current directory.
// `).option('--fail-on-missing-config');

// program.parse();
// const opts = program.opts();

// await Promise.all([run('central-server', opts), run('facility-server', opts)]);

const modelRoot = 'database/model/central-server';
const oldTablesPromise = readTablesFromFile('public');
const client = new pg.Client({ database: 'tamanu-central' });
await client.connect();
const newTablesPromise = readTablesFromDB(client, 'public');
const [oldTables, newTables] = await Promise.all([oldTablesPromise, newTablesPromise]);
await handleTables('tamanu-central', 'public', oldTables, newTables);
await client.end();
