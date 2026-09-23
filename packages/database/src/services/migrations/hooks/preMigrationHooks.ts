import { FACT_SYNC_TRIGGER_CONTROL } from '@tamanu/constants/facts';
import { REPORT_DB_CONNECTIONS, REPORT_DB_CONNECTION_SCHEMAS } from '@tamanu/constants';
import { requireManagedReportingSchema, requireTable } from './prerequisites';
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

const dropManagedReportingSchema: MigrationHook = {
  name: 'dropManagedReportingSchema',
  prerequisites: [requireManagedReportingSchema],
  async run({ log, sequelize }) {
    // Its views block DDL on the columns they read. Startup recreates the schema empty, and
    // alertd applies the one built for the new version once migrations have run.
    const schema = REPORT_DB_CONNECTION_SCHEMAS[REPORT_DB_CONNECTIONS.REPORTING];
    log.info('Dropping the managed reporting schema for migrations');
    await sequelize.query(`DROP SCHEMA "${schema}" CASCADE;`);
  },
};

export const PRE_MIGRATION_HOOKS: MigrationHook[] = [
  disableSyncTickTrigger,
  dropManagedReportingSchema,
];
