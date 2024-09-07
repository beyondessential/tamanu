// This is a port of `generate_source` from https://github.com/dbt-labs/dbt-codegen.

import { program } from 'commander';
import YAML from 'yaml';
import pg from 'pg';

async function get_tables_in_schema(client, schemaName, tablePattern, exclude) {
  return (
    await client.query(
      `SELECT DISTINCT lower(table_name) as table_name
      FROM information_schema.tables
      WHERE table_schema ilike $1 and table_name ilike $2 and table_name not ilike $3
      ORDER BY lower(table_name)`,
      [schemaName, tablePattern, exclude],
    )
  ).rows.map(table => table.table_name);
}

async function get_columns_in_relation(client, schemaName, table) {
  return (
    await client.query(
      `SELECT lower(column_name) as column_name, lower(data_type) as data_type
      FROM information_schema.columns
      WHERE table_schema ilike $1 and table_name = $2`,
      [schemaName, table],
    )
  ).rows;
}

async function generate_source({
  password,
  name,
  database,
  schemaName = name,
  generateColumns,
  excludeDataTypes,
  tablePattern,
  exclude,
}) {
  const client = new pg.Client({ database, password });
  await client.connect();
  const sources = {
    version: 2,
    sources: [
      {
        name,
        database,
        schema_name: schemaName === name ? undefined : schemaName,
        tables: await Promise.all(
          (await get_tables_in_schema(client, schemaName, tablePattern, exclude)).map(
            async table => {
              return {
                name: table,
                columns: generateColumns
                  ? (await get_columns_in_relation(client, schemaName, table)).map(column => {
                      return {
                        name: column.column_name,
                        // TODO: data_type_format_source
                        data_type: !excludeDataTypes ? column.data_type : undefined,
                      };
                    })
                  : undefined,
              };
            },
          ),
        ),
      },
    ],
  };
  await client.end();
  return sources;
}

program
  .description('generates a Source model in dbt')
  .option('--password')
  .requiredOption('--name <string>', 'The name of your source', value => value.toLowerCase())
  .requiredOption('--database <string>', 'The database that your source data is in', value =>
    value.toLowerCase(),
  )
  .option(
    '--schema-name <string>',
    'The schema name that contains your source data (default: the same as `name`)',
    value => value.toLowerCase(),
  )
  .option(
    '--generate-columns',
    'Whether you want to add the column names to your source definition',
  )
  .option(
    '--exclude-data-types',
    'Whether you want to add data types to your source columns definitions',
  )
  .option(
    '--table-pattern <string>',
    'A table prefix / postfix that you want to subselect from all available tables within a given schema',
    '%',
  )
  .option('--exclude <string>', 'A string you want to exclude from the selection criteria', '');

program.parse();
const opts = program.opts();
const sources = await generate_source(opts);
console.log(YAML.stringify(sources));
