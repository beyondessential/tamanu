// run any post migration checks or side effects
// so far, this is just adding the updated_at_sync_tick column and trigger to all new tables
import config from 'config';
import { QueryTypes, type Sequelize } from 'sequelize';
import type { Logger } from 'winston';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { NON_LOGGED_TABLES, NON_SYNCING_TABLES } from './constants';
import { SYNC_TICK_FLAGS } from '../../sync/constants';

const tablesWithoutColumn = (sequelize: Sequelize, column: string) =>
  sequelize
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
      AND pg_attribute.attname IS NULL
      AND (pg_namespace.nspname || '.' || pg_class.relname) NOT IN ($excludes);
  `,
      { type: QueryTypes.SELECT, bind: { column, excludes: NON_SYNCING_TABLES } },
    )
    .then((rows) =>
      rows
        .map((row) => ({
          schema: (row as any).schema as string,
          table: (row as any).table as string,
        }))
        .filter(({ schema, table }) => !NON_SYNCING_TABLES.includes(`${schema}.${table}`)),
    );

const tablesWithoutTrigger = (
  sequelize: Sequelize,
  prefix: string,
  suffix: string,
  excludes: string[] = NON_SYNCING_TABLES,
) =>
  sequelize
    .query(
      `
      SELECT
        t.table_schema as schema,
        t.table_name as table,
        t.table_schema || '.' || t.table_name as full_name
      FROM information_schema.tables t
      LEFT JOIN information_schema.table_privileges privileges
        ON t.table_name = privileges.table_name AND privileges.table_schema in ('public', 'logs')
      WHERE
        NOT EXISTS (
          SELECT *
          FROM pg_trigger p
          WHERE p.tgname = substring(concat($prefix::text, lower(t.table_name), $suffix::text), 0, 64)
        )
        AND privileges.privilege_type = 'TRIGGER'
        AND t.table_schema IN ('public', 'logs')
        AND t.table_type != 'VIEW'
    `,
      { type: QueryTypes.SELECT, bind: { prefix, suffix } },
    )
    .then((rows) =>
       rows
        .map((row) => ({
          schema: (row as any).schema as string,
          table: (row as any).table as string,
        }))
        .filter(({ schema, table }) => !excludes.includes(`${schema}.${table}`)),
    );

const tablesWithTrigger = (
  sequelize: Sequelize,
  prefix: string,
  suffix: string,
  excludes: string[] = NON_SYNCING_TABLES,
) =>
  sequelize
    .query(
      `
      SELECT
        t.table_schema as schema,
        t.table_name as table
      FROM information_schema.tables t
      LEFT JOIN information_schema.table_privileges privileges
        ON t.table_name = privileges.table_name AND privileges.table_schema in ('public', 'logs')
      WHERE
        EXISTS (
          SELECT *
          FROM pg_trigger p
          WHERE p.tgname = substring(concat($prefix::text, lower(t.table_name), $suffix::text), 0, 64)
        )
        AND privileges.privilege_type = 'TRIGGER'
        AND t.table_schema IN ('public', 'logs')
        AND t.table_type != 'VIEW'
    `,
      { type: QueryTypes.SELECT, bind: { prefix, suffix } },
    )
    .then((rows) =>
      rows
        .map((row) => ({
          schema: (row as any).schema as string,
          table: (row as any).table as string,
        }))
        .filter(({ schema, table }) => !excludes.includes(`${schema}.${table}`)),
    );

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
  const initialValue = isFacilityServer ? SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE : 0
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
      .then((rows) => (rows?.[0] as any)?.count > 0);

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
