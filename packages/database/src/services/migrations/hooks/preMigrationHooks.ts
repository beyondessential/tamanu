import { GLOBAL_EXCLUDE_TABLES, NON_SYNCING_TABLES } from '../constants';
import { tablesWithTrigger } from '../../../utils';
import { requireFunction } from './prerequisites';
import type { MigrationHook } from './types';

const removeUpdatedAtSyncTickTrigger: MigrationHook = {
  name: 'removeUpdatedAtSyncTickTrigger',
  prerequisites: [requireFunction('set_updated_at_sync_tick')],
  async run({ log, sequelize }) {
    // remove updated sync tick trigger before migrations
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
  },
};

export const PRE_MIGRATION_HOOKS: MigrationHook[] = [removeUpdatedAtSyncTickTrigger];
