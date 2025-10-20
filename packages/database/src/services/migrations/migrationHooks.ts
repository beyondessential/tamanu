// run any post migration checks or side effects
// so far, this is just adding the updated_at_sync_tick column and trigger to all new tables
import config from 'config';
import { QueryTypes, type Sequelize } from 'sequelize';
import type { Logger } from 'winston';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { GLOBAL_EXCLUDE_TABLES, NON_LOGGED_TABLES, NON_SYNCING_TABLES } from './constants';
import { SYNC_TICK_FLAGS } from '../../sync/constants';

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

export const tablesWithoutColumn = (
  sequelize: Sequelize,
  column: string,
  excludes: string[] = NON_SYNCING_TABLES,
) => {
  const allExcludes = [...GLOBAL_EXCLUDE_TABLES, ...excludes];
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
        .filter(({ schema, table }) => !tableNameMatch(schema, table, allExcludes)),
    );
};
export const tablesWithoutTrigger = (
  sequelize: Sequelize,
  prefix: string,
  suffix: string,
  excludes: string[] = NON_SYNCING_TABLES,
) => {
  const allExcludes = [...GLOBAL_EXCLUDE_TABLES, ...excludes];
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
        .filter(({ schema, table }) => !tableNameMatch(schema, table, allExcludes)),
    );
};

export const tablesWithTrigger = (
  sequelize: Sequelize,
  prefix: string,
  suffix: string,
  excludes: string[] = NON_SYNCING_TABLES,
) => {
  const allExcludes = [...GLOBAL_EXCLUDE_TABLES, ...excludes];
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
        .filter(({ schema, table }) => !allExcludes.includes(`${schema}.${table}`)),
    );
};

export async function runPreMigration(log: Logger, sequelize: Sequelize) {
  // remove sync tick trigger before migrations
  // migrations are deterministic, so updating the sync tick just creates useless churn
  for (const { schema, table } of await tablesWithTrigger(
    sequelize,
    'set_',
    '_updated_at_sync_tick',
  )) {
    log.info(`Removing updated_at_sync_tick trigger from ${schema}.${table}`);
    await sequelize.query(
      `DROP TRIGGER set_${table}_updated_at_sync_tick ON "${schema}"."${table}"`,
    );
  }

  // remove changelog trigger before migrations
  for (const { schema, table } of await tablesWithTrigger(sequelize, 'record_', '_changelog')) {
    log.info(`Removing changelog trigger from ${schema}.${table}`);
    await sequelize.query(`DROP TRIGGER record_${table}_changelog ON "${schema}"."${table}"`);
  }
}

export async function runPostMigration(log: Logger, sequelize: Sequelize) {
  // add column: holds last update tick, default to 0 (will be caught in any initial sync) on central server
  // and SYNC_TICK_FLAGS.UPDATED_ELSEWHERE (not marked for sync) on facility
  // triggers will overwrite the default for future data, but this works for existing data
  const isFacilityServer = !!selectFacilityIds(config);
  const initialValue = isFacilityServer ? SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE : 0;
  for (const { schema, table } of await tablesWithoutColumn(sequelize, 'updated_at_sync_tick')) {
    log.info(`Adding updated_at_sync_tick column to ${schema}.${table}`);
    await sequelize.query(`
      ALTER TABLE "${schema}"."${table}" ADD COLUMN updated_at_sync_tick BIGINT NOT NULL DEFAULT ${initialValue};
    `);
    await sequelize.query(`
      CREATE INDEX ${table}_updated_at_sync_tick_index ON "${schema}"."${table}" (updated_at_sync_tick);
    `);
  }

  const functionExists = (name: string) =>
    sequelize
      .query('select count(*) as count from pg_catalog.pg_proc where proname = $name', {
        type: QueryTypes.SELECT,
        bind: { name },
      })
      .then(rows => (rows?.[0] as any)?.count > 0);

  // add trigger: before insert or update, set updated_at (overriding any that is passed in)
  if (await functionExists('set_updated_at_sync_tick')) {
    for (const { schema, table } of await tablesWithoutTrigger(
      sequelize,
      'set_',
      '_updated_at_sync_tick',
    )) {
      log.info(`Adding updated_at_sync_tick trigger to ${schema}.${table}`);
      await sequelize.query(`
      CREATE TRIGGER set_${table}_updated_at_sync_tick
      BEFORE INSERT OR UPDATE ON "${schema}"."${table}"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at_sync_tick();
    `);
    }
  }

  // add trigger to table for pg notify
  if (await functionExists('notify_table_changed')) {
    for (const { schema, table } of await tablesWithoutTrigger(sequelize, 'notify_', '_changed')) {
      log.info(`Adding notify change trigger to ${schema}.${table}`);
      await sequelize.query(`
      CREATE TRIGGER notify_${table}_changed
      AFTER INSERT OR UPDATE OR DELETE ON "${schema}"."${table}"
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_table_changed();
    `);
    }
  }

  // add trigger to table for changelogs
  if (await functionExists('record_change')) {
    for (const { schema, table } of await tablesWithoutTrigger(
      sequelize,
      'record_',
      '_changelog',
      NON_LOGGED_TABLES,
    )) {
      log.info(`Adding changelog trigger to ${schema}.${table}`);
      await sequelize.query(`
      CREATE TRIGGER record_${table}_changelog
      AFTER INSERT OR UPDATE ON "${schema}"."${table}"
      FOR EACH ROW
      EXECUTE FUNCTION logs.record_change();
    `);
    }
  }
}
