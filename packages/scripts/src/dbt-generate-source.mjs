#!/usr/bin/env node

// TODO:
// - [x] read a list of tables and clumns from existing `database/model`
// - [ ] For every missing table, add a new model and markdown file:
//  - a logic to singularise and pascal case table names (sequelize?)
// - [ ] For every missing column, add an entry to the model and markdown file:
//   - nicely edit markdown? It's not really a markdown but a bunch of Jinja template
// - [ ] For columns that have changed type, change the data_type in the model file.
//   - are we checking changes in constrains (UNIQUE and NONNULL) for data_tests?
// - [ ] For columns that are missing in the database but do exist in the model file, delete the section in the model file and markdown file and print a warning.
// - [ ] For tables that are missing in the database but do have a model file, delete the model file and markdown file and print a warning.

// Pipeline: make a collection of tables for old and new -> fill gaps -> apply to fs

process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
const { default: config } = await import('config');
import fs from 'node:fs/promises';
import inflection from 'inflection'; // TODO: use callsify or camelize -> singulirise. No guarantee it's the same but should work. I can use camelize code copy pasted from sequelize that may make it more consistent?
import path from 'node:path';
import pg from 'pg';
import { program } from 'commander';
import YAML from 'yaml';
import _ from 'lodash';

async function readTablesFromFile(root, schemaName) {
  const schemaPath = path.join(root, schemaName);
  const tablePromises = (await fs.readdir(schemaPath))
    .filter(tablePath => tablePath.endsWith('.yml'))
    .sort()
    .map(async tablePath => {
      const table = await fs.readFile(path.join(schemaPath, tablePath), { encoding: 'utf-8' });
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

async function getColumnsInRelation(client, schemaName, table) {
  return (
    await client.query(
      `SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = $1 and table_name = $2`,
      [schemaName, table],
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
      })),
    };
  });
  return Promise.all(tablePromises);
}

async function generateMissingModel(schemaName, table) {
  const table2 = {
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
            description: "{{ doc('table__table-name') }}",
            tags: [],
            columns: table.columns,
            // TODO: data_tests and descriptions
          },
        ],
      },
    ],
  };
}

async function handleColumns(tableName, existingColumns, newColumns) {
  // This is expensive yet the most straightforward implementation.
  // Algorithms that rely on sorted lists are out because we want preserve the original order of columns.
  // May be able to use Map, but it doesn't have convinient set operations.
  const removedColumns = _.differenceBy(existingColumns, newColumns, 'name');
  removedColumns.forEach(t => console.log(`removed ${t.name} in ${tableName}`));
  const missingColumns = _.differenceBy(newColumns, existingColumns, 'name');
  missingColumns.forEach(t => console.log(`missing ${t.name} in ${tableName}`));
  {
    const existingColumnsIntersection = _.intersectionBy(existingColumns, newColumns, 'name');
    for (const existingColumn of existingColumnsIntersection) {
      const newColumn = newColumns.find(c => c.name === existingColumn.name);
      if (existingColumn.data_type.toLowerCase() === newColumn.data_type.toLowerCase()) continue;
      console.log(
        `${existingColumn.data_type} vs ${newColumn.data_type} in ${existingColumn.name} --- ${tableName}`,
      );
    }
  }
}

async function handleTables(existingTables, newTables) {
  const removedTables = _.differenceBy(existingTables, newTables, 'name');
  removedTables.forEach(t => console.log(`removed ${t.name}`));
  const missingTables = _.differenceBy(newTables, existingTables, 'name');
  missingTables.forEach(t => console.log(`missing ${t.name}`));
  {
    const existingTablesIntersection = _.intersectionBy(existingTables, newTables, 'name');
    for (const existingTable of existingTablesIntersection) {
      const newTable = newTables.find(t => t.name === existingTable.name);
      handleColumns(existingTable.name, existingTable.columns, newTable.columns);
    }
  }
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

const oldTables = await readTablesFromFile('database/model/central-server', 'public');
const client = new pg.Client({ database: 'tamanu-central' });
await client.connect();
const newTables = await readTablesFromDB(client, 'public');
await handleTables(oldTables, newTables);
await client.end();