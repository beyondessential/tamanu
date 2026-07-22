import config from 'config';
import { FACT_SYNC_TRIGGER_CONTROL } from '@tamanu/constants/facts';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { SYNC_TICK_FLAGS } from '../../../sync/constants';
import { GLOBAL_EXCLUDE_TABLES, NON_LOGGED_TABLES, NON_SYNCING_TABLES } from '../constants';
import { allTables, tablesWithoutColumn, tablesWithoutTrigger } from '../../../utils';
import { requireFunction, requireTable } from './prerequisites';
import type { MigrationHook } from './types';

const addUpdatedAtSyncTickColumn: MigrationHook = {
  name: 'addUpdatedAtSyncTickColumn',
  prerequisites: [],
  async run({ log, sequelize }) {
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
  },
};

const addUpdatedAtTrigger: MigrationHook = {
  name: 'addUpdatedAtTrigger',
  prerequisites: [requireFunction('set_updated_at')],
  async run({ log, sequelize }) {
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
  },
};

// Drops and recreates the trigger unconditionally on every table, every migration batch (rather
// than first checking what's already installed) — DROP TRIGGER IF EXISTS + CREATE TRIGGER, not
// CREATE OR REPLACE TRIGGER, to stay compatible with Postgres 12.
const addOrReplaceUpdatedAtSyncTickTrigger: MigrationHook = {
  name: 'addOrReplaceUpdatedAtSyncTickTrigger',
  prerequisites: [requireFunction('set_updated_at_sync_tick')],
  async run({ log, sequelize }) {
    for (const { schema, table } of await allTables(sequelize, [
      ...GLOBAL_EXCLUDE_TABLES,
      ...NON_SYNCING_TABLES,
    ])) {
      log.debug(`Ensuring updated_at_sync_tick trigger on ${schema}.${table}`);
      await sequelize.query(
        `DROP TRIGGER IF EXISTS set_${table}_updated_at_sync_tick ON "${schema}"."${table}"`,
      );
      await sequelize.query(`
      CREATE TRIGGER set_${table}_updated_at_sync_tick
      BEFORE INSERT OR UPDATE ON "${schema}"."${table}"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at_sync_tick();
    `);
    }
  },
};

const addNotifyTableChangedTrigger: MigrationHook = {
  name: 'addNotifyTableChangedTrigger',
  prerequisites: [requireFunction('notify_table_changed')],
  async run({ log, sequelize }) {
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
  },
};

const addRecordChangeTrigger: MigrationHook = {
  name: 'addRecordChangeTrigger',
  prerequisites: [requireFunction('record_change')],
  async run({ log, sequelize }) {
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
  },
};

const enableSyncTickTrigger: MigrationHook = {
  name: 'enableSyncTickTrigger',
  prerequisites: [requireTable('local_system_facts')],
  async run({ log, sequelize }) {
    log.info('Re-enabling sync tick trigger after migrations');
    await sequelize.query(`
      UPDATE local_system_facts SET value = 'enabled' WHERE key = '${FACT_SYNC_TRIGGER_CONTROL}';
    `);
  },
};

export const POST_MIGRATION_HOOKS: MigrationHook[] = [
  addUpdatedAtSyncTickColumn,
  addUpdatedAtTrigger,
  addOrReplaceUpdatedAtSyncTickTrigger,
  addNotifyTableChangedTrigger,
  addRecordChangeTrigger,
  enableSyncTickTrigger,
];
