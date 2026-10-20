import { describe, expect, it, beforeAll, afterAll, afterEach } from 'vitest';
import { QueryTypes } from 'sequelize';
import config from 'config';
import { log } from '@tamanu/shared/services/logging/log';
import { closeDatabase, createTestDatabase } from '../../utilities';
import { runPostMigration } from '../../../src/services/migrations/hooks';
import {
  CENTRAL_NOTIFY_CHANGE_TABLES,
  FACILITY_NOTIFY_CHANGE_TABLES,
  NON_SYNCING_TABLES,
} from '../../../src/services/migrations/constants';

const tablesWithNotifyTrigger = async (sequelize: any): Promise<string[]> => {
  const rows = await sequelize.query(
    `
      SELECT DISTINCT event_object_schema || '.' || event_object_table as "qualifiedTable"
      FROM information_schema.triggers
      WHERE trigger_name = 'notify_' || event_object_table || '_changed'
    `,
    { type: QueryTypes.SELECT },
  );
  return rows.map(({ qualifiedTable }: { qualifiedTable: string }) => qualifiedTable).sort();
};

const tablesWithPatientIdColumn = async (sequelize: any): Promise<string[]> => {
  const rows = await sequelize.query(
    `
      SELECT 'public.' || c.table_name as "qualifiedTable"
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'patient_id'
        AND t.table_type = 'BASE TABLE'
    `,
    { type: QueryTypes.SELECT },
  );
  return rows.map(({ qualifiedTable }: { qualifiedTable: string }) => qualifiedTable);
};

const addNotifyTrigger = (sequelize: any, table: string) =>
  sequelize.query(`
    CREATE TRIGGER notify_${table}_changed
    AFTER INSERT OR UPDATE OR DELETE ON public.${table}
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_table_changed();
  `);

const dropNotifyTrigger = (sequelize: any, table: string) =>
  sequelize.query(`DROP TRIGGER IF EXISTS notify_${table}_changed ON public.${table};`);

// This package's test config sets serverFacilityIds, so the hooks run as a facility server
// unless a suite deletes it.
describe('reconcileNotifyTableChangedTrigger', () => {
  let sequelize: any;
  let originalServerFacilityIds: unknown;

  beforeAll(async () => {
    ({ sequelize } = await createTestDatabase());
    originalServerFacilityIds = config.serverFacilityIds;
  });

  afterEach(async () => {
    config.serverFacilityIds = originalServerFacilityIds;
    await runPostMigration(log, sequelize);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('on facility', () => {
    it('only keeps notify triggers on facility listened tables', async () => {
      await runPostMigration(log, sequelize);

      expect(await tablesWithNotifyTrigger(sequelize)).toEqual(
        [...FACILITY_NOTIFY_CHANGE_TABLES].sort(),
      );
    });

    it('drops a notify trigger left on an unlistened table', async () => {
      await addNotifyTrigger(sequelize, 'patients');

      await runPostMigration(log, sequelize);

      expect(await tablesWithNotifyTrigger(sequelize)).not.toContain('public.patients');
    });

    it('recreates a missing notify trigger on a listened table', async () => {
      await dropNotifyTrigger(sequelize, 'settings');

      await runPostMigration(log, sequelize);

      expect(await tablesWithNotifyTrigger(sequelize)).toContain('public.settings');
    });
  });

  describe('on central', () => {
    it('keeps notify triggers on central listened tables and synced tables with patient_id', async () => {
      delete config.serverFacilityIds;

      await runPostMigration(log, sequelize);

      const syncedPatientIdTables = (await tablesWithPatientIdColumn(sequelize)).filter(
        table => !NON_SYNCING_TABLES.includes(table),
      );
      const expectedTables = new Set([...CENTRAL_NOTIFY_CHANGE_TABLES, ...syncedPatientIdTables]);
      expect(await tablesWithNotifyTrigger(sequelize)).toEqual([...expectedTables].sort());
    });

    it('drops notify triggers on facility-only, non-syncing and logs tables', async () => {
      delete config.serverFacilityIds;

      await runPostMigration(log, sequelize);

      const tables = await tablesWithNotifyTrigger(sequelize);
      expect(tables).not.toContain('public.tasks');
      expect(tables).not.toContain('public.sync_lookup');
      expect(tables.filter(table => table.startsWith('logs.'))).toEqual([]);
    });
  });
});
