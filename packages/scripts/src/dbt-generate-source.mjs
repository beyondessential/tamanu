import path from 'node:path';
import { program } from 'commander';
import YAML from 'yaml';
import pg from 'pg';

async function getTablesInSchema(client, schemaName) {
  return (
    await client.query(
      `SELECT DISTINCT lower(table_name) as table_name
      FROM information_schema.tables
      WHERE table_schema ilike $1
      ORDER BY lower(table_name)`,
      [schemaName],
    )
  ).rows.map(table => table.table_name);
}

async function getColumnsInRelation(client, schemaName, table) {
  return (
    await client.query(
      `SELECT lower(column_name) as column_name, lower(data_type) as data_type
      FROM information_schema.columns
      WHERE table_schema ilike $1 and table_name = $2`,
      [schemaName, table],
    )
  ).rows;
}

async function generateSource({ host, port, name: database, username, password }) {
  const client = new pg.Client({ host, port, user: username, database, password });
  await client.connect();
  const schemaName = 'public';
  const sources = {
    version: 2,
    sources: [
      {
        name: 'public',
        database: database.toLowerCase(),
        tables: await Promise.all(
          (await getTablesInSchema(client, schemaName)).map(async table => {
            return {
              name: table,
              columns: (await getColumnsInRelation(client, schemaName, table)).map(column => {
                return {
                  name: column.column_name,
                  data_type: column.data_type,
                };
              }),
            };
          }),
        ),
      },
    ],
  };
  await client.end();
  return sources;
}

program
  .description('generates a Source model in dbt.')
  .requiredOption('--package <string>', 'The path to the package to look at. If undefined, values are read from env vars.');

program.parse();
const opts = program.opts();

process.env['NODE_CONFIG_DIR'] = path.join(opts.package, 'config');
const { default: config } = await import('config');

const sources = await generateSource(config.db);
console.log(YAML.stringify(sources));
