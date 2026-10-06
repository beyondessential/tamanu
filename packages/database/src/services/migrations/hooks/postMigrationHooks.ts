import config from 'config';

import { QueryTypes, type Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { FACT_SYNC_TRIGGER_CONTROL } from '@tamanu/constants/facts';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { SYNC_TICK_FLAGS } from '../../../sync/constants';
import {
  GLOBAL_EXCLUDE_TABLES,
  NON_LOGGED_TABLES,
  NON_SYNCING_TABLES,
  CENTRAL_NOTIFY_CHANGE_TABLES,
  FACILITY_NOTIFY_CHANGE_TABLES,
} from '../constants';
import {
  allTables,
  tablesWithTrigger,
  tablesWithoutColumn,
  tablesWithoutTrigger,
} from '../../../utils';
import { requireFunction, requireTable } from './prerequisites';
import type { MigrationHook } from './types';

const DELETE_TRIGGER_PREFIX = 'delete_';
const DELETE_TRIGGER_SUFFIX = '_from_sync_lookup';
const LOOKUP_TRACKED_DIRECTIONS: string[] = [
  SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
  SYNC_DIRECTIONS.BIDIRECTIONAL,
];

// Postgres silently truncates identifiers over 63 bytes; match that so a later lookup against the
// installed trigger name (pg_trigger.tgname) finds what CREATE TRIGGER actually stored.
const truncatedTriggerName = (prefix: string, table: string, suffix: string) =>
  `${prefix}${table}${suffix}`.slice(0, 63);

const isTableLookupTracked = (sequelize: Sequelize, table: string): boolean => {
  const model = Object.values(sequelize.models).find(
    m => m.tableName === table && m.usesPublicSchema,
  );
  return !!model && LOOKUP_TRACKED_DIRECTIONS.includes(model.syncDirection);
};

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

const addOrReplaceUpdatedAtSyncTickTrigger: MigrationHook = {
  name: 'addOrReplaceUpdatedAtSyncTickTrigger',
  prerequisites: [requireFunction('set_updated_at_sync_tick')],
  async run({ log, sequelize }) {
    const isCentralServer = !selectFacilityIds(config);

    for (const { schema, table } of await allTables(sequelize, [
      ...GLOBAL_EXCLUDE_TABLES,
      ...NON_SYNCING_TABLES,
    ])) {
      const isLookupTracked = isCentralServer && isTableLookupTracked(sequelize, table);
      log.debug(`Ensuring updated_at_sync_tick trigger on ${schema}.${table}`, {
        lookupTracked: isLookupTracked,
      });
      await sequelize.query(`
        DROP TRIGGER IF EXISTS set_${table}_updated_at_sync_tick ON "${schema}"."${table}";
        
        CREATE TRIGGER set_${table}_updated_at_sync_tick
        BEFORE INSERT OR UPDATE ON "${schema}"."${table}"
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at_sync_tick(${isLookupTracked ? `'true'` : ''});
    `);
    }
  },
};

const addSyncLookupDeleteTrigger: MigrationHook = {
  name: 'addSyncLookupDeleteTrigger',
  prerequisites: [requireFunction('flag_sync_lookup_for_rebuild_on_hard_delete')],
  async run({ log, sequelize }) {
    const isCentralServer = !selectFacilityIds(config);
    if (!isCentralServer) {
      return;
    }

    for (const { schema, table } of await tablesWithoutTrigger(
      sequelize,
      DELETE_TRIGGER_PREFIX,
      DELETE_TRIGGER_SUFFIX,
      [...GLOBAL_EXCLUDE_TABLES, ...NON_SYNCING_TABLES],
    )) {
      if (!isTableLookupTracked(sequelize, table)) {
        continue;
      }

      log.info(`Adding sync_lookup delete trigger to ${schema}.${table}`);
      const triggerName = truncatedTriggerName(DELETE_TRIGGER_PREFIX, table, DELETE_TRIGGER_SUFFIX);
      await sequelize.query(`
      CREATE TRIGGER ${triggerName}
      AFTER DELETE ON "${schema}"."${table}"
      FOR EACH ROW
      EXECUTE FUNCTION public.flag_sync_lookup_for_rebuild_on_hard_delete();
    `);
    }
  },
};

const tablesWithPatientIdColumn = async (sequelize: Sequelize): Promise<string[]> => {
  const rows = await sequelize.query<{ schema: string; table: string }>(
    `
      SELECT c.table_schema as schema, c.table_name as table
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'patient_id'
        AND t.table_type = 'BASE TABLE'
    `,
    { type: QueryTypes.SELECT },
  );
  return rows.map(({ schema, table }) => `${schema}.${table}`);
};

const centralNotifyTables = async (sequelize: Sequelize): Promise<Set<string>> => {
  // registerSyncLookupUpdateListener re-queues a synced record's children when its patient_id changes
  const patientIdTables = (await tablesWithPatientIdColumn(sequelize)).filter(
    table => !NON_SYNCING_TABLES.includes(table),
  );
  return new Set([...CENTRAL_NOTIFY_CHANGE_TABLES, ...patientIdTables]);
};

const facilityNotifyTables = (): Set<string> => new Set(FACILITY_NOTIFY_CHANGE_TABLES);

const reconcileNotifyTableChangedTrigger: MigrationHook = {
  name: 'reconcileNotifyTableChangedTrigger',
  prerequisites: [requireFunction('notify_table_changed')],
  async run({ log, sequelize }) {
    const isCentralServer = !selectFacilityIds(config);
    const notifyTables = isCentralServer
      ? await centralNotifyTables(sequelize)
      : facilityNotifyTables();

    const tablesWithNotifyTrigger = new Set(
      (await tablesWithTrigger(sequelize, 'notify_', '_changed')).map(
        ({ schema, table }) => `${schema}.${table}`,
      ),
    );

    for (const { schema, table } of await allTables(sequelize, GLOBAL_EXCLUDE_TABLES)) {
      const qualifiedTable = `${schema}.${table}`;
      const hasTrigger = tablesWithNotifyTrigger.has(qualifiedTable);
      const isWanted = notifyTables.has(qualifiedTable);

      if (isWanted && !hasTrigger) {
        log.info(`Adding notify change trigger to ${qualifiedTable}`);
        await sequelize.query(`
          CREATE TRIGGER notify_${table}_changed
          AFTER INSERT OR UPDATE OR DELETE ON "${schema}"."${table}"
          FOR EACH ROW
          EXECUTE FUNCTION public.notify_table_changed();
        `);
      } else if (!isWanted && hasTrigger) {
        log.info(`Removing unused notify change trigger from ${qualifiedTable}`);
        await sequelize.query(
          `DROP TRIGGER IF EXISTS notify_${table}_changed ON "${schema}"."${table}";`,
        );
      }
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
      AFTER INSERT OR UPDATE OR DELETE ON "${schema}"."${table}"
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
  addSyncLookupDeleteTrigger,
  reconcileNotifyTableChangedTrigger,
  addRecordChangeTrigger,
  enableSyncTickTrigger,
];
