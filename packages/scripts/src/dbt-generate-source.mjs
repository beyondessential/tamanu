#!/usr/bin/env node

// TODO:
// - [x] read a list of tables and clumns from existing `database/model`
// - [ ] If the yml file exists but the table schema name within doesn't match, discard the existing and create a new file.
// - [ ] check the table names as well

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
      return YAML.parse(table);
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
      `SELECT column_name, is_nullable, lower(data_type) as data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = $1 and table_name = $2`,
      [schemaName, tableName],
    )
  ).rows.map(row => ({
    name: row.column_name,
    is_nullable: row.is_nullable === 'YES' ? true : false,
    data_type: row.character_maximum_length
      ? `${row.data_type}(${row.character_maximum_length})`
      : row.data_type,
  }));
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
      columns: await getColumnsInRelation(client, schemaName, table),
    };
  });
  return await Promise.all(tablePromises);
}

async function readTableDoc(schemaName, tableName) {
  const re = /\{%\s*docs\s+\w+?__(\w+)\s*%\}([^}]+)\{%\s+enddocs\s*%\}/g;

  const text = await fs.readFile(path.join(modelRoot, schemaName, `${tableName}.md`), {
    encoding: 'utf-8',
  });

  const match = re.exec(text);
  if (match === null) return;

  const doc = {
    name: tableName,
    description: match[2].trim(),
    // Make columns list to preserve the order.
    columns: [],
  };

  while (true) {
    const match = re.exec(text);
    if (match === null) break;

    doc.columns.push({
      name: match[1],
      description: match[2].trim(),
    });
  }

  return doc;
}

async function generateDataTests(schemaName, tableName, column) {
  const data_tests = [];
  const isUnique = (await getConstraintsForColumn(schemaName, tableName, column.name)).some(
    c => c.constraint_type === 'UNIQUE' || c.constraint_type === 'PRIMARY KEY',
  );
  if (isUnique) data_tests.push('unique');
  if (!column.is_nullable) data_tests.push('not_null');
  return data_tests;
}

async function generateColumnModel(schemaName, tableName, column) {
  const dataTests = await generateDataTests(schemaName, tableName, column);
  return {
    name: column.name,
    data_type: column.data_type,
    description: `{{ doc('${tableName}__${column.name}') }}`,
    data_tests: dataTests.length === 0 ? undefined : dataTests,
  };
}

function generateColumnDoc(column) {
  return {
    name: column.name,
    description: 'TODO',
  };
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
  return {
    name: table.name,
    description: 'TODO',
    columns: table.columns.map(generateColumnDoc),
  };
}

function stringifyTableDoc(doc) {
  const stringifyColumn = column => {
    return `
{% docs ${doc.name}__${column.name} %}
${column.description}
{% enddocs %}
`;
  };

  return `\
{% docs table__${doc.name} %}
${doc.description}
{% enddocs %}
${doc.columns.map(stringifyColumn).join('')}`;
}

function fillMissingDocColumn(index, column, doc) {
  if (doc.columns.some(c => c.name === column.name)) return;

  doc.columns.splice(index, 0, generateColumnDoc(column));
}

async function fillMissingDoc(schemaName, table) {
  let file;
  try {
    file = await fs.open(path.join(modelRoot, schemaName, `${table.name}.md`), 'wx');
    await file.write(stringifyTableDoc(generateTableDoc(table)));
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  } finally {
    await file?.close();
  }
}

async function handleRemovedColumn(tableName, column, out) {
  console.warn(`Removing ${column.name} in ${tableName}`);
  _.remove(out.dbtColumns, c => c.name === column.name);
  _.remove(out.doc.columns, c => c.name === column.name);
}

async function handleMissingColumn(schemaName, tableName, index, column, out) {
  const model = await generateColumnModel(schemaName, tableName, column);
  out.dbtColumns.splice(index, 0, model);
  fillMissingDocColumn(index, column, out.doc);
}

async function handleRemovedTable(schemaName, table) {
  console.warn(`Removing ${table.get('name')}`);
  const tablePath = path.join(modelRoot, schemaName, table.name);
  await Promise.all([fs.rm(tablePath + '.yml'), fs.rm(tablePath + '.md', { force: true })]);
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

async function handleColumn(schemaName, tableName, dbtColumn, sqlColumn) {
  dbtColumn.data_type = sqlColumn.data_type;

  const sqlDataTests = await generateDataTests(schemaName, tableName, sqlColumn);
  if (!Object.hasOwn(dbtColumn, 'data_tests')) dbtColumn.data_tests = [];

  // Instead of computing differences while ignoring non-trivial data tests, simply replace them by the generated one.
  _.remove(dbtColumn.data_tests, t => t === 'unique' || t === 'not_null');
  dbtColumn.data_tests.splice(0, 0, ...sqlDataTests);

  if (dbtColumn.data_tests.length === 0) delete dbtColumn.data_tests;
}

async function handleColumns(schemaName, tableName, dbtSrc, sqlColumns) {
  const out = {
    dbtColumns: dbtSrc.sources[0].tables[0].columns,
    doc: await readTableDoc(schemaName, tableName),
  };

  // This is expensive yet the most straightforward implementation to detect changes.
  // Algorithms that rely on sorted lists are out because we want preserve the original order of columns.
  // May be able to use Map, but it doesn't have convinient set operations.
  const removedPromises = _.differenceBy(out.dbtColumns, sqlColumns, 'name').map(column =>
    handleRemovedColumn(tableName, column, out),
  );
  const missingPromises = _.differenceBy(sqlColumns, out.dbtColumns, 'name').map(column =>
    handleMissingColumn(schemaName, tableName, sqlColumns.indexOf(column), column, out),
  );

  const intersectionPromises = _.intersectionBy(out.dbtColumns, sqlColumns, 'name').map(
    async dbtColumn => {
      const sqlColumnIndex = sqlColumns.findIndex(c => c.name === dbtColumn.name);
      const sqlColumn = sqlColumns[sqlColumnIndex];

      fillMissingDocColumn(sqlColumnIndex, dbtColumn, out.doc);

      await handleColumn(schemaName, tableName, dbtColumn, sqlColumn);
    },
  );

  await Promise.all([...removedPromises, ...missingPromises, ...intersectionPromises]);

  const tablePath = path.join(modelRoot, schemaName, tableName);
  // TODO: this formats the YAML aggresively. Specifically, it makes every sequences block-styled.
  // THere's no API in the library to switch the style based on the length of the content.
  // Preserving the collection style is possible (the code is git-stashed), but it adds newlines systemically.
  // There's no way I can preserve line-breaking style of administered_vaccines.status.data_tests.accepted_values
  const modelPromise = fs.writeFile(tablePath + '.yml', YAML.stringify(dbtSrc));
  const docPromise = fs.writeFile(tablePath + '.md', stringifyTableDoc(out.doc));
  await Promise.all([modelPromise, docPromise]);
}

async function handleTables(dbName, schemaName, dbtSrcs, sqlTables) {
  const getName = srcOrTable =>
    srcOrTable.sources ? srcOrTable.sources[0].tables[0].name : srcOrTable.name;
  const removedPromises = _.differenceBy(dbtSrcs, sqlTables, getName).map(src =>
    handleRemovedTable(schemaName, src.sources[0].tables[0]),
  );
  const missingPromises = _.differenceBy(sqlTables, dbtSrcs, getName).map(table =>
    handleMissingTable(schemaName, table),
  );

  const intersectionPromises = _.intersectionBy(dbtSrcs, sqlTables, getName).map(async dbtSrc => {
    const sqlTable = sqlTables.find(t => t.name === dbtSrc.sources[0].tables[0].name);
    await fillMissingDoc(schemaName, sqlTable);
    await handleColumns(schemaName, sqlTable.name, dbtSrc, sqlTable.columns);
  });
  await Promise.all([...removedPromises, ...missingPromises, ...intersectionPromises]);
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
    await fs.outir(schemaPath, { recursive: true });
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
const sqlTablesPromise = readTablesFromDB(client, 'public');
const [oldTables, sqlTables] = await Promise.all([oldTablesPromise, sqlTablesPromise]);
await handleTables('tamanu-central', 'public', oldTables, sqlTables);
await client.end();
