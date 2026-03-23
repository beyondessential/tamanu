import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { SYNC_TICK_FLAGS } from '../../../sync/constants';
import { GLOBAL_EXCLUDE_TABLES, NON_LOGGED_TABLES, NON_SYNCING_TABLES } from '../constants';
import { tablesWithoutColumn, tablesWithoutTrigger } from '../../../utils';
import { requireFunction, requireMigration, requireMigrationNotApplied } from './prerequisites';
import type { MigrationHook } from './types';

const addUpdatedAtSyncTickColumn: MigrationHook = {
  name: 'addUpdatedAtSyncTickColumn',
  prerequisites: [],
  async run({ log, sequelize }) {
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

const addUpdatedAtSyncTickTrigger: MigrationHook = {
  name: 'addUpdatedAtSyncTickTrigger',
  prerequisites: [requireFunction('set_updated_at_sync_tick')],
  async run({ log, sequelize }) {
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

/**
 * The old record_change trigger, which was used prior to converting to a constraint trigger.
 */
const addRecordChangeTriggerV1: MigrationHook = {
  name: 'addRecordChangeTriggerV1',
  prerequisites: [
    requireFunction('record_change'),
    requireMigrationNotApplied('1765226354430-convertChangelogToConstraintTriggers.js'),
  ],
  async run({ log, sequelize }) {
    for (const { schema, table } of await tablesWithoutTrigger(sequelize, 'record_', '_changelog', [
      ...GLOBAL_EXCLUDE_TABLES,
      ...NON_LOGGED_TABLES,
    ])) {
      log.info(`Adding old changelog trigger to ${schema}.${table}`);
      await sequelize.query(`
      CREATE TRIGGER record_${table}_changelog
      AFTER INSERT OR UPDATE ON "${schema}"."${table}"
      FOR EACH ROW
      EXECUTE FUNCTION logs.record_change();
    `);
    }
  },
};

/**
 * The new record_change constraint trigger. This trigger is not backwards compatible with earlier migrations
 * as they maybe have been written to contain data and schema changes in the same transaction (causes pending constraints error).
 *
 * So we only run this hook after the convertChangelogToConstraintTriggers migration has been run.
 */
const addRecordChangeTriggerV2: MigrationHook = {
  name: 'addRecordChangeTriggerV2',
  prerequisites: [
    requireFunction('record_change'),
    requireMigration('1765226354430-convertChangelogToConstraintTriggers.js'),
  ],
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

export const POST_MIGRATION_HOOKS: MigrationHook[] = [
  addUpdatedAtSyncTickColumn,
  addUpdatedAtTrigger,
  addUpdatedAtSyncTickTrigger,
  addNotifyTableChangedTrigger,
  addRecordChangeTriggerV1,
  addRecordChangeTriggerV2,
];
