#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const YAML = require('yaml');
const { compact, differenceBy, intersectionBy, remove } = require('lodash');
const { spawnSync } = require('child_process');

const KNOWN_TABLE_MASKING_KINDS = ['truncate'];
const KNOWN_COLUMN_MASKING_KINDS = [
  'date',
  'datetime',
  'default',
  'email',
  'empty',
  'float',
  'integer',
  'money',
  'name',
  'nil',
  'phone',
  'place',
  'string',
  'text',
  'url',
  'zero',
];

/**
 * @param {string} schemaPath The path to the dir with source model files for a schema
 * @returns A list of source model files as JS objects.
 */
async function readTablesFromDbt(schemaPath, noSymlinks = false) {
  const tablePromises = (await fs.readdir(schemaPath, { withFileTypes: true }))
    .filter(entry => (noSymlinks ? !entry.isSymbolicLink() : true))
    .map(entry => entry.name)
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
 * @returns {Array<{ name: string; oid: number }>} A list of table names that the given schema name has
 */
async function getTablesInSchema(client, schemaName) {
  return (
    await client.query(
      `SELECT DISTINCT
        table_name as name,
         ('"' || table_schema || '"."' || table_name || '"')::regclass::oid as oid
      FROM information_schema.tables
      WHERE table_schema = $1
      ORDER BY table_name`,
      [schemaName],
    )
  ).rows;
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
 * @param {number} oid
 * @returns {Array<string>} A list of triggers that exist on the given table.
 */
async function getTriggers(client, oid) {
  return (
    (
      await client.query(
        `SELECT tgname as name
        FROM pg_trigger
        WHERE tgisinternal = false AND tgrelid = $1`,
        [oid],
      )
    ).rows
      .map(({ name }) => name)
      // RI_ are Postgres-internal triggers; tgisinternal should take care of that, but hedge just in case
      .filter(name => !name.startsWith('RI_'))
      .sort()
  );
}

/**
 * @param {pg.Client} client
 * @param {string} schemaName
 * @param {string} tableName
 * @param {string} columnName
 * @returns A list of constrains exist for the given column
 */
async function getConstraintsForColumn(client, schemaName, tableName, columnName) {
  const constraints = (
    await client.query(
      `SELECT constraint_name, constraint_type, json_agg(column_name) AS column_names
      FROM information_schema.table_constraints NATURAL JOIN information_schema.constraint_column_usage
      WHERE table_schema = $1 and table_name = $2
      GROUP BY constraint_name, constraint_type`,
      [schemaName, tableName],
    )
  ).rows;

  return (
    constraints
      .filter(cons => cons.column_names.includes(columnName))
      // ignore multi-column constraints, e.g. composite UNIQUE
      .filter(cons => cons.column_names.length === 1)
      .flatMap(cons =>
        cons.column_names.map(col => ({
          column_name: col,
          constraint_type: cons.constraint_type,
        })),
      )
  );
}

/**
 * @param {pg.Client} client
 * @param {string} schemaName
 * @returns A list of tables read from the DB as JS objects
 */
async function readTablesFromDB(client, schemaName) {
  const tablePromises = (await getTablesInSchema(client, schemaName)).map(async ({ name, oid }) => {
    return {
      name,
      oid,
      triggers: await getTriggers(client, oid),
      columns: (await getColumnsInRelation(client, schemaName, name)).map(column => {
        // Lazily evaluate constraints as it's only occasionally needed.
        column.getConstraints = () =>
          getConstraintsForColumn(client, schemaName, name, column.name);
        return column;
      }),
    };
  });
  return await Promise.all(tablePromises);
}

function* dbtDocParser(input) {
  let remain = input;

  let section = null;
  while (remain.length) {
    if (section) {
      // find the next {% enddocs %}
      const match = /^\{%\s*enddocs\s*%\}\s*$/m.exec(remain);
      if (!match || !match.length) break;

      const contents = remain.substring(0, match.index).trim();
      remain = remain.substring(match.index + match[0].length);

      yield { section, contents };
      section = null;
    } else {
      // find the next {% docs ... %}
      const match = /^\{%\s*docs\s+(.+)%\}\s*$/m.exec(remain);
      if (!match || !match.length) break;

      remain = remain.substring(match.index + match[0].length);
      section = match[1].trim();
    }
  }
}

/**
 * Reads a table document from a file and parse into a structured JS object.
 *
 * @param {string} schema
 * @param {string} tableName
 * @returns A table document object or null if the doc doesn't exist
 */
async function readTableDoc(schema, tableName) {
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
    description: 'TODO',
    // Make columns a list to preserve the order.
    columns: [],
  };

  const sections = [];
  const parser = dbtDocParser(text);
  let section = null;
  while ((section = parser.next().value)) {
    sections.push(section);
  }

  const expectedTablePrefix = `${docPrefix(schema, 'table')}__`;
  const expectedColumnPrefix = `${docPrefix(schema, tableName)}__`;
  for (const { section, contents } of sections) {
    if (section.startsWith(expectedTablePrefix)) {
      doc.description = contents;
      continue;
    }

    if (!section.startsWith(expectedColumnPrefix)) {
      // just ignore invalid sections, which will drop them
      continue;
    }

    const name = section.substring(expectedColumnPrefix.length);
    if (!name) continue;

    doc.columns.push({
      name,
      description: contents,
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
 * @param {{ name: string; path: string }} schema
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
    config:
      schema.name !== 'fhir' && column.data_type === 'text'
        ? { meta: { masking: 'text' } }
        : undefined,
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
 * @param {{ name: string; path: string }} schema
 * @param {{ name: string; oid: number; columns: object[]; triggers: string[] }} table
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
        tables: [
          {
            name: table.name,
            description: `{{ doc('${docPrefix(schema, 'table')}__${table.name}') }}`,
            config: {
              tags: [],
              meta: {
                masking: schema.name === 'fhir' ? 'truncate' : undefined,
                triggers: table.triggers,
              },
            },
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
  if (
    (await fs.stat(docPath).then(
      stat => stat.size,
      () => 1,
    )) === 0
  ) {
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
 * @param {{ name: string; path: string }} schema
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
  delete dbtColumn.__generator;
  dbtColumn.description = generateColumnModelDescription(
    schema,
    tableName,
    dbtColumn.name,
    hasGenericDoc,
  );

  const sqlDataTests = await generateDataTests(sqlColumn);
  if (!Object.hasOwn(dbtColumn, 'data_tests')) dbtColumn.data_tests = [];

  // Instead of computing differences while ignoring non-trivial data tests, simply replace them by the generated one.
  remove(dbtColumn.data_tests, t => t === 'unique' || t === 'not_null');
  dbtColumn.data_tests.splice(0, 0, ...sqlDataTests);

  if (dbtColumn.data_tests.length === 0) delete dbtColumn.data_tests;

  const masking = dbtColumn.config?.meta?.masking;
  if (
    (typeof masking === 'string' || typeof masking?.kind === 'string') &&
    !KNOWN_COLUMN_MASKING_KINDS.includes(masking?.kind ?? masking)
  ) {
    throw new Error(
      `On column ${tableName}.${dbtColumn.name} found unknown masking kind: ${masking?.kind ?? masking}`,
    );
  }
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
    handleMissingColumn(
      schema,
      tableName,
      sqlColumns.indexOf(column),
      column,
      genericColNames,
      out,
    ),
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
  const modelPromise = fs.writeFile(
    tablePath + '.yml',
    YAML.stringify(dbtSrc, { lineWidth: -1, noRefs: true }),
  );
  const docPromise = fs.writeFile(tablePath + '.md', stringifyTableDoc(schema, out.doc));
  await Promise.all([modelPromise, docPromise]);
}

async function handleTable(schema, dbtSrc, sqlTable, genericColNames) {
  const source = dbtSrc.sources[0];
  source.schema = schema.name;
  source.name = docPrefix(schema, 'tamanu');
  delete source.__generator;

  const table = source.tables[0];
  table.config = table.config ?? {};
  table.config.meta = table.config.meta ?? {};
  table.config.meta.triggers = sqlTable.triggers;

  const masking = table.config.meta.masking;
  if (
    (typeof masking === 'string' || typeof masking?.kind === 'string') &&
    !KNOWN_TABLE_MASKING_KINDS.includes(masking?.kind ?? masking)
  ) {
    throw new Error(
      `On table ${table.name} found unknown masking kind: ${masking?.kind ?? masking}`,
    );
  }

  table.description = `{{ doc('${docPrefix(schema, 'table')}__${sqlTable.name}') }}`;
  await fillMissingDoc(schema, sqlTable, genericColNames);
  await handleColumns(schema, sqlTable.name, dbtSrc, sqlTable.columns, genericColNames);
}

async function handleTables(schema, dbtSrcs, sqlTables) {
  const genericColNames = (await readTableDoc(schema, 'generic'))?.columns.map(c => c.name) ?? [];

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

async function handleSchema(client, schemaName) {
  const schemaPath = path.join('database/model', schemaName);
  await fs.mkdir(schemaPath, { recursive: true });
  const oldTablesPromise = readTablesFromDbt(schemaPath);
  const sqlTablesPromise = readTablesFromDB(client, schemaName);
  const [oldTables, sqlTables] = await Promise.all([oldTablesPromise, sqlTablesPromise]);

  await handleTables(
    {
      name: schemaName,
      path: schemaPath,
    },
    compact(oldTables),
    compact(sqlTables),
  );
}

async function run(opts) {
  console.log('-+');

  const { default: config } = await import('config');
  const serverConfig = config.util.loadFileConfigs(
    path.join('packages', 'central-server', 'config'),
  );
  const dbConfig = config.util.extendDeep(serverConfig.db, config.db);

  const { initDatabase } = require('@tamanu/database/services/database');
  let client;
  const dbName = 'tamanu-generate-model';
  try {
    console.log(' | connecting to database');
    console.log('Create new database', dbName);
    const db = await initDatabase({
      ...dbConfig,
      testMode: true,
      recreateDatabase: true,
      name: dbName,
    });
    await db.sequelize.drop({ cascade: true });
    await db.sequelize.migrate('up');
    client = await db.sequelize.connectionManager.getConnection();
  } catch (err) {
    console.error(err);
    if (opts.failOnMissingConfig) {
      throw `Invalid database config, cannot proceed.`;
    }

    return false;
  }

  console.log(' | loading schemas');

  const schemas = await getSchemas(client);
  for (const schema of schemas) {
    console.log(' | updating source models for', schema);
    await handleSchema(client, schema);
  }

  console.log(' + done, disconnecting');
  await client.end();
  console.log();
  return true;
}

function checkClean() {
  const subprocess = spawnSync('git', ['status', '--porcelain=v2', 'database'], { shell: true });
  return subprocess.stdout.length === 0;
}

async function runAll() {
  const { program } = require('commander');
  const { exit } = require('node:process');

  program
    .description('Generate dbt models from the current (central) database')
    .option('--fail-on-missing-config', 'Exit with 1 if we cannot connect to a db')
    .option(
      '--allow-dirty',
      'Proceed even if there are uncommitted changed in the database/ folder',
    );

  program.parse();
  const opts = program.opts();

  if (!opts.allowDirty && !checkClean()) {
    console.error(
      `Error: 'database/' has uncommitted changes. Use --allow-dirty if you're sure. You may lose work!`,
    );
    exit(1);
  }

  await run(opts);
}

module.exports = {
  readTablesFromDbt,
  readTableDoc,
};

if (require.main === module) runAll();
