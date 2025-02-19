// run any post migration checks or side effects
// so far, this is just adding the updated_at_sync_tick column and trigger to all new tables
import config from 'config';
import { QueryTypes } from 'sequelize';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { NON_LOGGED_TABLES, NON_SYNCING_TABLES } from './constants';

const tablesWithoutColumn = (sequelize, column) =>
  sequelize.query(
    `
    SELECT pg_class.relname as table
    FROM pg_catalog.pg_class
    JOIN pg_catalog.pg_namespace
      ON pg_class.relnamespace = pg_namespace.oid
    LEFT JOIN pg_catalog.pg_attribute
    ON pg_attribute.attrelid = pg_class.oid
      AND pg_attribute.attname = $column
    WHERE pg_namespace.nspname = 'public'
      AND pg_class.relkind = 'r'
      AND pg_attribute.attname IS NULL
      AND pg_class.relname NOT IN ($excludes);
  `,
    { type: QueryTypes.SELECT, bind: { column, excludes: NON_SYNCING_TABLES } },
  );

const tablesWithoutTrigger = (sequelize, prefix, suffix, excludes = NON_SYNCING_TABLES) =>
  sequelize.query(
    `
      SELECT t.table_name as table
      FROM information_schema.tables t
      LEFT JOIN information_schema.table_privileges privileges
        ON t.table_name = privileges.table_name AND privileges.table_schema = 'public'
      WHERE
        NOT EXISTS (
          SELECT *
          FROM pg_trigger p
          WHERE p.tgname = substring(concat($prefix::text, lower(t.table_name), $suffix::text), 0, 64)
        )
        AND privileges.privilege_type = 'TRIGGER'
        AND t.table_schema = 'public'
        AND t.table_type != 'VIEW'
        AND t.table_name NOT IN ($excludes);
    `,
    { type: QueryTypes.SELECT, bind: { prefix, suffix, excludes } },
  );

const tablesWithTrigger = (sequelize, prefix, suffix, excludes = []) =>
  sequelize.query(
    `
      SELECT t.table_name as table
      FROM information_schema.tables t
      LEFT JOIN information_schema.table_privileges privileges
        ON t.table_name = privileges.table_name AND privileges.table_schema = 'public'
      WHERE
        EXISTS (
          SELECT *
          FROM pg_trigger p
          WHERE p.tgname = substring(concat($prefix::text, lower(t.table_name), $suffix::text), 0, 64)
        )
        AND privileges.privilege_type = 'TRIGGER'
        AND t.table_schema = 'public'
        AND t.table_type != 'VIEW'
        AND t.table_name NOT IN ($excludes);
    `,
    { type: QueryTypes.SELECT, bind: { prefix, suffix, excludes } },
  );

export async function runPreMigration(log, sequelize) {
  // remove sync tick trigger before migrations
  // migrations are deterministic, so updating the sync tick just creates useless churn
  for (const { table } of await tablesWithTrigger(sequelize, 'set_', '_updated_at_sync_tick')) {
    log.info(`Removing updated_at_sync_tick trigger from ${table}`);
    await sequelize.query(`DROP TRIGGER set_${table}_updated_at_sync_tick ON "${table}"`);
  }

  // remove changelog trigger before migrations
  // except from SequelizeMeta, so that migrations are recorded in the changelog
  for (const { table } of await tablesWithTrigger(sequelize, 'record_', '_changelog', [
    'SequelizeMeta',
  ])) {
    log.info(`Removing changelog trigger from ${table}`);
    await sequelize.query(`DROP TRIGGER record_${table}_changelog ON "${table}"`);
  }
}

export async function runPostMigration(log, sequelize) {
  // add column: holds last update tick, default to -999 (not marked for sync) on facility,
  // and 0 (will be caught in any initial sync) on central server
  // triggers will overwrite the default for future data, but this works for existing data
  const isFacilityServer = !!selectFacilityIds(config);
  const initialValue = isFacilityServer ? -999 : 0; // -999 on facility, 0 on central server
  for (const { table } of await tablesWithoutColumn(sequelize, 'updated_at_sync_tick')) {
    log.info(`Adding updated_at_sync_tick column to ${table}`);
    await sequelize.query(`
      ALTER TABLE "${table}" ADD COLUMN updated_at_sync_tick BIGINT NOT NULL DEFAULT ${initialValue};
    `);
    await sequelize.query(`
      CREATE INDEX ${table}_updated_at_sync_tick_index ON "${table}" (updated_at_sync_tick);
    `);
  }

  const functionExists = (name) =>
    sequelize
      .query('select count(*) as count from pg_catalog.pg_proc where proname = $name', {
        type: QueryTypes.SELECT,
        bind: { name },
      })
      .then((rows) => rows?.[0]?.count > 0);

  // add trigger: before insert or update, set updated_at (overriding any that is passed in)
  if (await functionExists('set_updated_at_sync_tick')) {
    for (const { table } of await tablesWithoutTrigger(
      sequelize,
      'set_',
      '_updated_at_sync_tick',
    )) {
      log.info(`Adding updated_at_sync_tick trigger to ${table}`);
      await sequelize.query(`
      CREATE TRIGGER set_${table}_updated_at_sync_tick
      BEFORE INSERT OR UPDATE ON "${table}"
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at_sync_tick();
    `);
    }
  }

  // add trigger to table for pg notify
  if (await functionExists('notify_table_changed')) {
    for (const { table } of await tablesWithoutTrigger(sequelize, 'notify_', '_changed')) {
      log.info(`Adding notify change trigger to ${table}`);
      await sequelize.query(`
      CREATE TRIGGER notify_${table}_changed
      AFTER INSERT OR UPDATE OR DELETE ON "${table}"
      FOR EACH ROW
      EXECUTE FUNCTION notify_table_changed();
    `);
    }
  }

  // add trigger to table for changelogs
  if (await functionExists('record_change')) {
    for (const { table } of await tablesWithoutTrigger(
      sequelize,
      'record_',
      '_changelog',
      NON_LOGGED_TABLES,
    )) {
      log.info(`Adding changelog trigger to ${table}`);
      await sequelize.query(`
      CREATE TRIGGER record_${table}_changelog
      AFTER INSERT OR UPDATE ON "${table}"
      FOR EACH ROW
      EXECUTE FUNCTION logs.record_change();
    `);
    }
  }
}
