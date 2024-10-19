#!/usr/bin/env node

// A script to check any todo items in the database source model

const fs = require('node:fs/promises');
const path = require('node:path');
const { exit } = require('node:process');
const { readTablesFromDbt, readTableDoc } = require('./dbt-generate-source.js');

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
    console.log(`TODO: table description for ${schema.name}.${table.name}, in ${schema.path}/${table.name}.yml'`);
  }

  const doc = await readTableDoc(schema, table.name);
  if (doc === null) return;

  const isDocTodo = doc.description === 'TODO';
  if (isDocTodo) {
    console.log(`TODO: table documentation for ${schema.name}.${table.name}, in ${schema.path}/${table.name}.md`);
  }

  const todoColumnDocs = doc.columns.filter(c => c.description === 'TODO');
  for (const column of todoColumnDocs) {
    console.log(
      `TODO: column documentation for ${schema.name}.${table.name}:${column.name}, in ${schema.path}/${table.name}.md`,
    );
  }

  return (+isDescriptionTodo) + (+isDocTodo) + todoColumnDocs.length;
}

async function run(packageName) {
  const promises = (await getSchemas(packageName)).map(async schema => {
    const detectPromises = (await readTablesFromDbt(schema.path)).map(s =>
      detectTodoItemsInTable(schema, s),
    );
    return (await Promise.all(detectPromises)).reduce((acc, n) => acc + n, 0);
  });
  return (await Promise.all(promises)).reduce((acc, n) => acc + n, 0);
}

(async function() {
  const promises = [run('central-server'), run('facility-server')];
  const detected = (await Promise.all(promises)).reduce((acc, n) => acc + n, 0);
  if (detected) {
    console.error(`${detected} items remaining to document`);
    exit(1);
  }
})();
