import { program } from 'commander'
import YAML from 'yaml'
import pg from 'pg'

async function get_tables_in_schema(client, schemaName, tablePattern, exclude) {
    const QUERY = 'SELECT DISTINCT lower(table_name) as table_name FROM information_schema.tables WHERE table_schema ilike $1 AND table_name ilike $2 AND table_name not ilike $3 ORDER BY lower(table_name)';
    return (await client.query(QUERY, [schemaName, tablePattern, exclude])).rows.map(table => table.table_name);
}

async function get_columns_in_relation(client, schemaName, table) {
    const QUERY = 'SELECT lower(column_name) as column_name, lower(data_type) as data_type FROM information_schema.columns WHERE table_schema ilike $1 and table_name = $2';
    return (await client.query(QUERY, [schemaName, table])).rows;
}

async function generate_source({ password, name, database, schemaName = name, generateColumns, excludeDataTypes, tablePattern, exclude }) {
    const client = new pg.Client({ database, password });
    await client.connect();
    const sources = {
        version: 2,
        sources: [
            {
                name: name.toLowerCase(),
                database: database.toLowerCase(),
                schema_name: schemaName ? schemaName.toLowerCase() : undefined, // TODO: what happens when undefined?
                tables: await Promise.all((await get_tables_in_schema(client, schemaName, tablePattern, exclude))
                    .map(async table => {
                        return {
                            name: table,
                            columns: generateColumns ? (await get_columns_in_relation(client, schemaName, table))
                                .map(column => {
                                    return {
                                        name: column.column_name,
                                        // TODO: data_type_format_source
                                        data_type: !excludeDataTypes ? column.data_type : undefined,
                                    };
                                }) : undefined
                        };
                    }))
            }
        ]
    };
    await client.end();
    return sources;
}

program
    .option('password')
    .requiredOption('--name <string>')
    .requiredOption('--database <string>')
    .option('--schema-name <string>')
    .option('--generate-columns')
    .option('--exclude-data-types')
    .option('--table-pattern <string>', '', '%')
    .option('--exclude <string>', '', '')

program.parse()
const opts = program.opts();
const sources = await generate_source(opts);
console.log(YAML.stringify(sources));
