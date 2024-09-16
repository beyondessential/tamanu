import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { program } from 'commander';
import YAML from 'yaml';

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

  const tasks = ['public', 'fhir', 'logs'].map(async schemaName => {
    await fs.mkdir(`database/model/${schemaName}`);
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
      await fs.writeFile(`database/model/${schemaName}/${table}.yml`, YAML.stringify(sources));
    });
    await Promise.all(tasks);
  });
  await Promise.all(tasks);
  await client.end();
}

program
  .description('generates a Source model in dbt.')
  .requiredOption(
    '--package <string>',
    'The path to the package to look at. If undefined, values are read from env vars.',
  );

program.parse();
const opts = program.opts();

process.env['NODE_CONFIG_DIR'] = path.join(opts.package, 'config');
const { default: config } = await import('config');

await generateSource(config.db);
