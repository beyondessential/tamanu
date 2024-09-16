process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
const { default: config } = await import('config');
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { program } from 'commander';
import YAML from 'yaml';

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

async function generateSource({ host, port, name: database, username, password }, packageName) {
  const client = new pg.Client({ host, port, user: username, database, password });
  await client.connect();

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
                columns: (await getColumnsInRelation(client, schemaName, table)).map(column => {
                  return {
                    name: column.column_name,
                    data_type: column.data_type,
                  };
                }),
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

async function run(packageName) {
  const serverConfig = config.util.loadFileConfigs(path.join('packages', packageName, 'config'));
  const db = config.util.extendDeep(serverConfig.db, config.db); // merge with NODE_CONFIG
  if (['host', 'port', 'name', 'username', 'password'].some(key => db[key] === undefined)) {
    return;
  }
  await generateSource(db, packageName);
}

program.description('generates a Source model in dbt.');

program.parse();
const opts = program.opts();

await Promise.all([run('central-server'), run('facility-server')]);
