#!/usr/bin/env node

// A script to check any todo items in the database source model

const fs = require('node:fs/promises');
const path = require('node:path');
const { exit } = require('node:process');
const { readTablesFromDbt, readTableDoc } = require('./generateModel.js');

async function getSchemas() {
  const modelPath = path.join('database', 'model');
  return (await fs.readdir(modelPath))
    .filter((filename) => filename === 'overview.md')
    .map((schemaName) => ({
      name: schemaName,
      path: path.join(modelPath, schemaName),
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

  const isTagsTodo = dbtSrc.sources[0].tags?.length === 0;
  if (isTagsTodo) {
    console.log(
      `TODO: table tags for ${schema.name}.${table.name}, in ${schema.path}/${table.name}.yml'`,
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

  const todoColumnDocs = doc.columns.filter((c) => c.description === 'TODO');
  for (const column of todoColumnDocs) {
    console.log(
      `TODO: column documentation for ${schema.name}.${table.name}:${column.name}, in ${schema.path}/${table.name}.md`,
    );
  }

  return +isDescriptionTodo + +isTagsTodo + +isDocTodo + todoColumnDocs.length;
}

async function run() {
  let sum = 0;
  const schemas = await getSchemas();
  for (const schema of schemas) {
    if (schema.path.endsWith('.md')) continue;
    const tables = await readTablesFromDbt(schema.path, true);
    for (const table of tables) {
      sum += await detectTodoItemsInTable(schema, table);
    }
  }
  return sum;
}

(async function () {
  const todos = await run();
  if (todos) {
    console.log(`${todos} items remaining to document`);
    exit(1);
  }
})();
