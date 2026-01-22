// run any post migration checks or side effects
// so far, this is just adding the updated_at_sync_tick column and trigger to all new tables
import config from 'config';
import { QueryTypes, type Sequelize } from 'sequelize';
import type { Logger } from 'winston';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { GLOBAL_EXCLUDE_TABLES, NON_LOGGED_TABLES, NON_SYNCING_TABLES } from './constants';
import { SYNC_TICK_FLAGS } from '../../sync/constants';
import { tablesWithoutColumn, tablesWithoutTrigger, tablesWithTrigger } from '../../utils';

export async function runPreMigration(log: Logger, sequelize: Sequelize) {
  // remove sync tick trigger before migrations
  // migrations are deterministic, so updating the sync tick just creates useless churn
  for (const { schema, table } of await tablesWithTrigger(
    sequelize,
    'set_',
    '_updated_at_sync_tick',
    [...GLOBAL_EXCLUDE_TABLES, ...NON_SYNCING_TABLES],
  )) {
    // we need to keep the updated_at_sync_tick trigger on the changes table
    if (schema === 'logs' && table === 'changes') {
      continue;
    }

    log.info(`Removing updated_at_sync_tick trigger from ${schema}.${table}`);

    await sequelize.query(
      `DROP TRIGGER set_${table}_updated_at_sync_tick ON "${schema}"."${table}"`,
    );
  }
}

export async function runPostMigration(log: Logger, sequelize: Sequelize) {
  // add column: holds last update tick, default to 0 (will be caught in any initial sync) on central server
  // and SYNC_TICK_FLAGS.UPDATED_ELSEWHERE (not marked for sync) on facility
  // triggers will overwrite the default for future data, but this works for existing data
  const isFacilityServer = !!selectFacilityIds(config);
  const initialValue = isFacilityServer ? SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE : 0;
  for (const { schema, table } of await tablesWithoutColumn(sequelize, 'updated_at_sync_tick', [
    ...GLOBAL_EXCLUDE_TABLES,
    ...NON_SYNCING_TABLES,
  ])) {
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

  // add trigger: before update, update updated_at when the data in the row changed
  if (await functionExists('set_updated_at')) {
    for (const { schema, table } of await tablesWithoutTrigger(sequelize, 'set_', '_updated_at', [
      ...GLOBAL_EXCLUDE_TABLES,
      ...NON_SYNCING_TABLES,
    ])) {
      log.info(`Adding updated_at trigger to ${schema}.${table}`);
      await sequelize.query(`
      CREATE TRIGGER set_${table}_updated_at
      BEFORE INSERT OR UPDATE ON "${schema}"."${table}"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
    `);
    }
  }

  // add trigger: before insert or update, set updated_at_sync_tick (overriding any that is passed in)
  if (await functionExists('set_updated_at_sync_tick')) {
    for (const { schema, table } of await tablesWithoutTrigger(
      sequelize,
      'set_',
      '_updated_at_sync_tick',
      [...GLOBAL_EXCLUDE_TABLES, ...NON_SYNCING_TABLES],
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
    for (const { schema, table } of await tablesWithoutTrigger(sequelize, 'notify_', '_changed', [
      ...GLOBAL_EXCLUDE_TABLES,
      ...NON_SYNCING_TABLES,
    ])) {
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
    for (const { schema, table } of await tablesWithoutTrigger(sequelize, 'record_', '_changelog', [
      ...GLOBAL_EXCLUDE_TABLES,
      ...NON_LOGGED_TABLES,
    ])) {
      log.info(`Adding changelog trigger to ${schema}.${table}`);
      await sequelize.query(`
      CREATE CONSTRAINT TRIGGER record_${table}_changelog
      AFTER INSERT OR UPDATE ON "${schema}"."${table}"
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW
      EXECUTE FUNCTION logs.record_change();
    `);
    }
  }
}
