#!/usr/bin/env node

// A script to check any todo items in the database source model

const fs = require('node:fs/promises');
const path = require('node:path');
const { exit } = require('node:process');
const { readTablesFromDbt, readTableDoc } = require('./generateModel.js');

async function getSchemas(packageName) {
  const packagePath = path.join('database/model', packageName);
  return (await fs.readdir(packagePath)).map(schemaName => ({
    name: schemaName,
    path: path.join(packagePath, schemaName),
  }));
}

async function detectTodoItemsInTable(schema, dbtSrc) {
  const table = dbtSrc.sources[0].tables[0];
  const isDescriptionTodo = dbtSrc.sources[0].description === 'TODO';
  if (isDescriptionTodo) {
    console.log(
      `TODO: table description for ${schema.name}.${table.name}, in ${schema.path}/${table.name}.yml'`,
    );
  }

  const doc = await readTableDoc(schema, table.name);
  if (doc === null) return;

  const isDocTodo = doc.description === 'TODO';
  if (isDocTodo) {
    console.log(
      `TODO: table documentation for ${schema.name}.${table.name}, in ${schema.path}/${table.name}.md`,
    );
  }

  const todoColumnDocs = doc.columns.filter(c => c.description === 'TODO');
  for (const column of todoColumnDocs) {
    console.log(
      `TODO: column documentation for ${schema.name}.${table.name}:${column.name}, in ${schema.path}/${table.name}.md`,
    );
  }

  return +isDescriptionTodo + +isDocTodo + todoColumnDocs.length;
}

async function run() {
  let sum = 0;
  for (const packageName of ['central-server', 'facility-server']) {
    const schemas = await getSchemas(packageName);
    for (const schema of schemas) {
      const tables = await readTablesFromDbt(schema.path, true);
      for (const table of tables) {
        sum += await detectTodoItemsInTable(schema, table);
      }
    }
  }
  return sum;
}

(async function() {
  const todos = await run();
  if (todos) {
    console.log(`${todos} items remaining to document`);
    exit(1);
  }
})();
