import { QueryTypes, type Sequelize } from 'sequelize';

const tableNameMatch = (schema: string, table: string, matches: string[]) => {
  const matchTableSchemas = matches
    .map(match => match.split('.'))
    .map(([excludeSchema, excludeTable]) => ({ schema: excludeSchema, table: excludeTable }));
  const wholeSchemaMatches = matchTableSchemas
    .filter(({ table: matchTable }) => matchTable === '*')
    .map(({ schema: matchSchema }) => matchSchema);
  if (wholeSchemaMatches.includes(schema)) {
    return true;
  }

  return matchTableSchemas.some(
    ({ schema: matchSchema, table: matchTable }) => schema === matchSchema && table === matchTable,
  );
};

export const tablesWithTrigger = (
  sequelize: Sequelize,
  prefix: string,
  suffix: string,
  excludes: string[] = [],
) => {
  return sequelize
    .query(
      `
          SELECT
            t.table_schema as schema,
            t.table_name as table
          FROM information_schema.tables t
          JOIN information_schema.triggers triggers ON
            t.table_name = triggers.event_object_table
            AND t.table_schema = triggers.event_object_schema
            AND triggers.trigger_name = substring(concat($prefix::text, lower(t.table_name), $suffix::text), 0, 64)
          WHERE
            t.table_schema IN ('public', 'logs')
            AND t.table_type != 'VIEW'
          GROUP BY t.table_schema, t.table_name -- Group to ensure unique results
        `,
      { type: QueryTypes.SELECT, bind: { prefix, suffix } },
    )
    .then(rows =>
      rows
        .map(row => ({
          schema: (row as any).schema as string,
          table: (row as any).table as string,
        }))
        .filter(({ schema, table }) => !tableNameMatch(schema, table, excludes)),
    );
};

export const tablesWithoutTrigger = (
  sequelize: Sequelize,
  prefix: string,
  suffix: string,
  excludes: string[] = [],
) => {
  return sequelize
    .query(
      `
        SELECT
          t.table_schema as schema,
          t.table_name as table
        FROM information_schema.tables t
        LEFT JOIN information_schema.triggers triggers ON
          t.table_name = triggers.event_object_table
          AND t.table_schema = triggers.event_object_schema
          AND triggers.trigger_name = substring(concat($prefix::text, lower(t.table_name), $suffix::text), 0, 64)
        WHERE
          t.table_schema IN ('public', 'logs')
          AND t.table_type != 'VIEW'
          AND triggers.trigger_name IS NULL -- No matching trigger
        GROUP BY t.table_schema, t.table_name -- Group to ensure unique results
      `,
      { type: QueryTypes.SELECT, bind: { prefix, suffix } },
    )
    .then(rows =>
      rows
        .map(row => ({
          schema: (row as any).schema as string,
          table: (row as any).table as string,
        }))
        .filter(({ schema, table }) => !tableNameMatch(schema, table, excludes)),
    );
};

export const tablesWithoutColumn = (
  sequelize: Sequelize,
  column: string,
  excludes: string[] = [],
) => {
  return sequelize
    .query(
      `
      SELECT
        pg_namespace.nspname as schema,
        pg_class.relname as table
      FROM pg_catalog.pg_class
      JOIN pg_catalog.pg_namespace
        ON pg_class.relnamespace = pg_namespace.oid
      LEFT JOIN pg_catalog.pg_attribute
      ON pg_attribute.attrelid = pg_class.oid
        AND pg_attribute.attname = $column
      WHERE pg_namespace.nspname IN ('public', 'logs')
        AND pg_class.relkind = 'r'
        AND pg_attribute.attname IS NULL;
    `,
      { type: QueryTypes.SELECT, bind: { column } },
    )
    .then(rows =>
      rows
        .map(row => ({
          schema: (row as any).schema as string,
          table: (row as any).table as string,
        }))
        .filter(({ schema, table }) => !tableNameMatch(schema, table, excludes)),
    );
};
