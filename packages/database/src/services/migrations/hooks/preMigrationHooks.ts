import { FACT_SYNC_TRIGGER_CONTROL } from '@tamanu/constants/facts';
import { requireTable } from './prerequisites';
import type { MigrationHook } from './types';

const disableSyncTickTrigger: MigrationHook = {
  name: 'disableSyncTickTrigger',
  prerequisites: [requireTable('local_system_facts')],
  async run({ log, sequelize }) {
    // Put the sync tick trigger into disabled mode (the same mechanism dataMigrations'
    // disableSyncTrigger uses) rather than dropping it. Migrations are deterministic, so
    // updating the sync tick causes us to unnecessarily sync large amounts of data
    log.info('Disabling sync tick trigger for migrations');
    await sequelize.query(`
      INSERT INTO local_system_facts (key, value)
      VALUES ('${FACT_SYNC_TRIGGER_CONTROL}', 'disabled')
      ON CONFLICT (key) DO UPDATE SET value = 'disabled';
    `);
  },
};

export const PRE_MIGRATION_HOOKS: MigrationHook[] = [disableSyncTickTrigger];
