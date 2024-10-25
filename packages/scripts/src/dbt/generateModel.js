#!/usr/bin/env node

process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
const config = require('config');
const fs = require('node:fs/promises');
const inflection = require('inflection');
const path = require('node:path');
const pg = require('pg');
const YAML = require('yaml');
const { compact, differenceBy, intersectionBy, remove } = require('lodash');
const { spawnSync } = require('child_process');

/**
 * @param {string} schemaPath The path to the dir with source model files for a schema
 * @returns A list of source model files as JS objects.
 */
async function readTablesFromDbt(schemaPath) {
  const tablePromises = (await fs.readdir(schemaPath))
    .filter(tablePath => tablePath.endsWith('.yml'))
    .sort()
    .map(async tablePath => {
      const table = await fs.readFile(path.join(schemaPath, tablePath), { encoding: 'utf-8' });
      return YAML.parse(table);
    });
  return await Promise.all(tablePromises);
}

/**
 * @param {pg.Client} client
 * @returns A list of "relevant" schema names exist in the DB
 */
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

/**
 * @param {pg.Client} client
 * @param {string} schemaName
 * @returns A list of table names that the given schema name has
 */
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

/**
 * @param {pg.Client} client
 * @param {string} schemaName
 * @param {string} tableName
 * @returns A list of columns exist within the given table.
 */
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

/**
 * @param {pg.Client} client
 * @param {string} schemaName
 * @param {string} tableName
 * @param {string} columnName
 * @returns A list of constrains exist for the given column
 */
async function getConstraintsForColumn(client, schemaName, tableName, columnName) {
  return (
    await client.query(
      `SELECT constraint_type
      FROM information_schema.table_constraints NATURAL JOIN information_schema.constraint_column_usage
      WHERE table_schema = $1 and table_name = $2 and column_name = $3`,
      [schemaName, tableName, columnName],
    )
  ).rows;
}

/**
 * @param {pg.Client} client
 * @param {string} schemaName
 * @returns A list of tables read from the DB as JS objects
 */
async function readTablesFromDB(client, schemaName) {
  const tablePromises = (await getTablesInSchema(client, schemaName)).map(async table => {
    return {
      name: table,
      columns: (await getColumnsInRelation(client, schemaName, table)).map(column => {
        // Lazily evaluate constraints as it's only occasionally needed.
        column.getConstraints = () =>
          getConstraintsForColumn(client, schemaName, table, column.name);
        return column;
      }),
    };
  });
  return await Promise.all(tablePromises);
}

/**
 * Reads a table document from a file and parse into a structured JS object.
 *
 * @param {string} schema
 * @param {string} tableName
 * @returns A table document object or null if the doc doesn't exist
 */
async function readTableDoc(schema, tableName) {
  const re = new RegExp(`\\{%\\s*docs\\s+${docPrefix(schema, '\\w+')}__(\\w+)\\s*%\\}([^}]+)\\{%\\s+enddocs\\s*%\\}`, 'g');

  let text;
  try {
    text = await fs.readFile(path.join(schema.path, `${tableName}.md`), {
      encoding: 'utf-8',
    });
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return null;
  }

  const doc = {
    name: tableName,
    // Make columns a list to preserve the order.
    columns: [],
  };

  // generic.md isn't for a particular table and thus doesn't have a `table_*` section.
  if (tableName !== 'generic') {
    const match = re.exec(text);
    if (match === null) return null;
    doc.description = match[2].trim();
  }

  let match;
  while ((match = re.exec(text)) !== null) {
    doc.columns.push({
      name: match[1],
      description: match[2].trim(),
    });
  }

  return doc;
}

/**
 * Generates a `data_tests` section based on column constraints.
 *
 * @param {object} column
 * @returns A date test object, directly serialisable as dbt models.
 */
async function generateDataTests(column) {
  const dataTests = [];
  const isUnique = (await column.getConstraints()).some(
    c => c.constraint_type === 'UNIQUE' || c.constraint_type === 'PRIMARY KEY',
  );
  if (isUnique) dataTests.push('unique');
  if (!column.is_nullable) dataTests.push('not_null');
  return dataTests;
}

/**
 * @param {object} schema
 * @param {string} kind
 * @returns {string} The prefix to use for doc keys.
 */
function docPrefix(schema, kind) {
  if (schema.name === 'public') return kind;

  return `${schema.name}__${kind}`;
}

/**
 * @param {string} tableName
 * @param {object} column
 * @param {boolean} hasGenericDoc If true, generates `description` to point to the generic document
 * @returns {string} The default description of a column.
 */
function generateColumnModelDescription(schema, tableName, columnName, hasGenericDoc) {
  return hasGenericDoc
    ? `{{ doc('${docPrefix(schema, 'generic')}__${columnName}') }} in ${tableName}.`
    : `{{ doc('${docPrefix(schema, tableName)}__${columnName}') }}`;
}

/**
 * @param {string} tableName
 * @param {object} column
 * @param {boolean} hasGenericDoc If true, generates `description` to point to the generic document
 * @returns A column object, directly serialisable as dbt models.
 */
async function generateColumnModel(schema, tableName, column, hasGenericDoc) {
  const dataTests = await generateDataTests(column);
  return {
    name: column.name,
    data_type: column.data_type,
    description: generateColumnModelDescription(schema, tableName, column.name, hasGenericDoc),
    data_tests: dataTests.length === 0 ? undefined : dataTests,
  };
}

/**
 *
 * @param {object} column
 * @returns A column document object, directly serialisable.
 */
function generateColumnDoc(column) {
  return {
    name: column.name,
    description: 'TODO',
  };
}

/**
 * @param {string} schemaName
 * @param {object} table
 * @param {string[]} genericColNames
 * @returns A table object, directly serialisable as dbt model.
 */
async function generateTableModel(schema, table, genericColNames) {
  return {
    version: 2,
    sources: [
      {
        name: docPrefix(schema, 'tamanu'),
        schema: schema.name,
        description: `{{ doc('${docPrefix(schema, 'generic')}__schema') }}`,
        __generator: { js_class: inflection.classify(table.name) },
        tables: [
          {
            name: table.name,
            description: `{{ doc('${docPrefix(schema, 'table')}__${table.name}') }}`,
            tags: [],
            columns: await Promise.all(
              table.columns.map(c =>
                generateColumnModel(schema, table.name, c, genericColNames.includes(c.name)),
              ),
            ),
          },
        ],
      },
    ],
  };
}

/**
 *
 * @param {object} table
 * @param {string[]} genericColNames
 * @returns A table document object, directly serialisable.
 */
function generateTableDoc(table, genericColNames) {
  return {
    name: table.name,
    description: 'TODO',
    columns: table.columns.filter(c => !genericColNames.includes(c.name)).map(generateColumnDoc),
  };
}

/**
 *
 * @param {object} doc
 * @returns A string form of the given table doc
 */
function stringifyTableDoc(schema, doc) {
  const stringifyColumn = column => {
    return `
{% docs ${docPrefix(schema, doc.name)}__${column.name} %}
${column.description}
{% enddocs %}
`;
  };

  return `\
{% docs ${docPrefix(schema, 'table')}__${doc.name} %}
${doc.description}
{% enddocs %}
${doc.columns.map(stringifyColumn).join('')}`;
}

/**
 * @param {number} index The array index of the given column in the order defined in the DB
 * @param {object} column
 * @param {boolean} hasGenericDoc If true, doesn't fill the missing document
 * @param {object} doc The sink the generated doc get added
 * @returns
 */
function fillMissingDocColumn(index, column, hasGenericDoc, doc) {
  if (doc.columns.some(c => c.name === column.name) || hasGenericDoc) return;

  doc.columns.splice(index, 0, generateColumnDoc(column));
}

/**
 * Generate a table document if it's missing and write as a file.
 *
 * @param {string} schema
 * @param {object} table
 * @param {string[]} genericColNames
 */
async function fillMissingDoc(schema, table, genericColNames = []) {
  const docPath = path.join(schema.path, `${table.name}.md`);

  // delete empty files
  if ((await fs.stat(docPath).then(stat => stat.size, () => 1)) === 0) {
    await fs.unlink(docPath);
  }

  let file;
  try {
    file = await fs.open(docPath, 'wx');
    await file.write(stringifyTableDoc(schema, generateTableDoc(table, genericColNames)));
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  } finally {
    await file?.close();
  }
}

/**
 * @param {string} tableName
 * @param {object} column
 * @param {object} out the sink the removal operation operates on
 */
async function handleRemovedColumn(tableName, column, out) {
  console.warn(` | removing ${column.name} in ${tableName}`);
  remove(out.dbtColumns, c => c.name === column.name);
  remove(out.doc.columns, c => c.name === column.name);
}

/**
 *
 * @param {string} tableName
 * @param {number} index The array index of the given column in the order defined in the DB
 * @param {object} column
 * @param {string[]} genericColNames
 * @param {object} out the sink the addition operation operates on
 */
async function handleMissingColumn(schema, tableName, index, column, genericColNames, out) {
  const hasGenericDoc = genericColNames.includes(column.name);
  const model = await generateColumnModel(schema, tableName, column, hasGenericDoc);
  out.dbtColumns.splice(index, 0, model);
  fillMissingDocColumn(index, column, hasGenericDoc, out.doc);
}

/**
 * Deletes the given table's source model and its document from the filesystem
 *
 * @param {string} schema
 * @param {object} table
 */
async function handleRemovedTable(schema, table) {
  console.warn(` | removing table ${table.name}`);
  const tablePath = path.join(schema.path, table.name);
  await Promise.all([fs.rm(tablePath + '.yml'), fs.rm(tablePath + '.md', { force: true })]);
}

/**
 * Generates the given table's source model and its document if missing. Then it writes as files.
 *
 * @param {object} schema
 * @param {object} table
 * @param {string[]} genericColNames
 */
async function handleMissingTable(schema, table, genericColNames) {
  const genModelPromise = (async () => {
    const model = await generateTableModel(schema, table, genericColNames);
    await fs.writeFile(path.join(schema.path, `${table.name}.yml`), YAML.stringify(model));
  })();
  const docPromise = fillMissingDoc(schema, table, genericColNames);
  await Promise.all([genModelPromise, docPromise]);
}

async function handleColumn(schema, tableName, dbtColumn, sqlColumn, hasGenericDoc) {
  dbtColumn.data_type = sqlColumn.data_type;
  if (!dbtColumn.description) {
    dbtColumn.description = generateColumnModelDescription(
      schema,
      tableName,
      dbtColumn.name,
      hasGenericDoc,
    );
  }

  const sqlDataTests = await generateDataTests(sqlColumn);
  if (!Object.hasOwn(dbtColumn, 'data_tests')) dbtColumn.data_tests = [];

  // Instead of computing differences while ignoring non-trivial data tests, simply replace them by the generated one.
  remove(dbtColumn.data_tests, t => t === 'unique' || t === 'not_null');
  dbtColumn.data_tests.splice(0, 0, ...sqlDataTests);

  if (dbtColumn.data_tests.length === 0) delete dbtColumn.data_tests;
}

async function handleColumns(schema, tableName, dbtSrc, sqlColumns, genericColNames) {
  const out = {
    dbtColumns: dbtSrc.sources[0].tables[0].columns,
    doc: await readTableDoc(schema, tableName),
  };

  // This is expensive yet the most straightforward implementation to detect changes.
  // Algorithms that rely on sorted lists are out because we want preserve the original order of columns.
  // May be able to use Map, but it doesn't have convenient set operations.
  differenceBy(out.dbtColumns, sqlColumns, 'name').forEach(column =>
    handleRemovedColumn(tableName, column, out),
  );
  differenceBy(sqlColumns, out.dbtColumns, 'name').forEach(column =>
    handleMissingColumn(schema, tableName, sqlColumns.indexOf(column), column, genericColNames, out),
  );

  const intersectionPromises = intersectionBy(out.dbtColumns, sqlColumns, 'name').map(
    async dbtColumn => {
      const sqlColumnIndex = sqlColumns.findIndex(c => c.name === dbtColumn.name);
      const sqlColumn = sqlColumns[sqlColumnIndex];

      const hasGenericDoc = genericColNames.includes(dbtColumn.name);
      fillMissingDocColumn(sqlColumnIndex, dbtColumn, hasGenericDoc, out.doc);
      await handleColumn(schema, tableName, dbtColumn, sqlColumn, hasGenericDoc);
    },
  );

  await Promise.all(intersectionPromises);

  const tablePath = path.join(schema.path, tableName);
  const modelPromise = fs.writeFile(tablePath + '.yml', YAML.stringify(dbtSrc));
  const docPromise = fs.writeFile(tablePath + '.md', stringifyTableDoc(schema, out.doc));
  await Promise.all([modelPromise, docPromise]);
}

async function handleTable(schema, dbtSrc, sqlTable, genericColNames) {
  dbtSrc.sources[0].schema = schema.name;
  dbtSrc.sources[0].name = docPrefix(schema, 'tamanu');

  await fillMissingDoc(schema, sqlTable, genericColNames);
  await handleColumns(schema, sqlTable.name, dbtSrc, sqlTable.columns, genericColNames);
}

async function handleTables(schema, dbtSrcs, sqlTables) {
  const genericColNames =
    (await readTableDoc(schema, 'generic'))?.columns.map(c => c.name) ?? [];

  const getName = srcOrTable =>
    srcOrTable.sources ? srcOrTable.sources[0].tables[0].name : srcOrTable.name;
  const removedPromises = differenceBy(dbtSrcs, sqlTables, getName).map(src =>
    handleRemovedTable(schema, src.sources[0].tables[0]),
  );
  const missingPromises = differenceBy(sqlTables, dbtSrcs, getName).map(table =>
    handleMissingTable(schema, table, genericColNames),
  );

  const intersectionPromises = intersectionBy(dbtSrcs, sqlTables, getName).map(async dbtSrc => {
    const sqlTable = sqlTables.find(t => t.name === dbtSrc.sources[0].tables[0].name);
    await handleTable(schema, dbtSrc, sqlTable, genericColNames);
  });
  await Promise.all([...removedPromises, ...missingPromises, ...intersectionPromises]);
}

async function handleSchema(client, packageName, schemaName) {
  const schemaPath = path.join('database/model', packageName, schemaName);
  await fs.mkdir(schemaPath, { recursive: true });
  const oldTablesPromise = readTablesFromDbt(schemaPath);
  const sqlTablesPromise = readTablesFromDB(client, schemaName);
  const [oldTables, sqlTables] = await Promise.all([oldTablesPromise, sqlTablesPromise]);

  const fhirLogsIndex = sqlTables.findIndex(
    ({ name }) =>
      packageName === 'facility-server' && schemaName === 'logs' && name === 'fhir_writes',
  );
  if (fhirLogsIndex) delete sqlTables[fhirLogsIndex];

  await handleTables({
    name: schemaName,
    path: schemaPath,
  }, compact(oldTables), compact(sqlTables));
}

async function run(packageName, opts) {
  const serverConfig = config.util.loadFileConfigs(path.join('packages', packageName, 'config'));
  const db = config.util.extendDeep(serverConfig.db, config.db); // merge with NODE_CONFIG

  console.log('-+', packageName);
  console.log(' | connecting to database');
  const client = new pg.Client({
    host: db.host,
    port: db.port,
    user: db.username,
    database: db.name,
    password: db.password,
  });
  try {
    await client.connect();
  } catch (err) {
    console.error(err);
    if (opts.failOnMissingConfig) {
      throw `Invalid database config for ${packageName}, cannot proceed.`;
    }

    return;
  }

  console.log(' | loading schemas');

  const schemas = await getSchemas(client);
  for (const schema of schemas) {
    if (packageName === 'facility-server' && ['fhir'].includes(schema)) continue;

    console.log(' | updating source models for', schema);
    await handleSchema(client, packageName, schema);
  }

  console.log(' + done, disconnecting');
  await client.end();
  console.log();
}

function checkClean() {
  const subprocess = spawnSync('git', ['status', '--porcelain=v2', 'database'], { shell: true });
  return subprocess.stdout.length === 0;
}

async function runAll() {
  const { program } = require('commander');
  const { exit } = require('node:process');

  program
    .description(
      `Generates a Source model in dbt.
This reads Postgres database based on the config files. The search path is \`packages/<server-name>/config\`. \
You can override the config for both by supplying \`NODE_CONFIG\` or the \`config\` directory at the current directory.
`,
    )
    .option('--fail-on-missing-config')
    .option('--allow-dirty');

  program.parse();
  const opts = program.opts();

  if (!opts.allowDirty && !checkClean()) {
    console.error(
      `Error: 'database/' has uncommitted changes. Use --allow-dirty if you're sure. You may lose work!`,
    );
    exit(1);
  }

  await run('central-server', opts);
  await run('facility-server', opts);
}

module.exports = {
  readTablesFromDbt,
  readTableDoc,
};

if (require.main === module) runAll();
