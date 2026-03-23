import { closeDatabase, initDatabase } from '../utilities';
import { runPostMigration, runPreMigration } from '../../src/services/migrations/hooks';
import { createMigrationInterface } from '@tamanu/database/services/migrations';
import { fake } from '@tamanu/fake-data/fake';
import { log } from '@tamanu/shared/services/logging/log';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';

describe('migrations', () => {
  describe('Disabling sync trigger', () => {
    let database, umzug, models, report_definition;
    beforeEach(async () => {
      database = await initDatabase();
      models = database.models;
      umzug = createMigrationInterface(log, database.sequelize);
      await runPreMigration(log, database.sequelize);
      await umzug.up();
      await runPostMigration(log, database.sequelize);
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 1);
      // setup test data
      const { ReportDefinition } = models;
      report_definition = await ReportDefinition.create(
        fake(ReportDefinition, {
          dbSchema: 'raw',
        }),
      );
    });

    afterEach(async () => {
      await closeDatabase();
    });

    it('should not trigger the sync tick update while migrating', async () => {
      const tickAtStart = await report_definition.updatedAtSyncTick;

      // act
      await umzug.down({ to: '1692710205000-allowDisablingSyncTrigger' });
      await umzug.up({ step: 1 });
      await report_definition.reload();
      const tickAfterMigration = await report_definition.updatedAtSyncTick;

      // assertions
      expect(tickAtStart).toBe('1');
      expect(tickAfterMigration).toBe('1');
    }, 30000);

    it('ensure sync tick update still work', async () => {
      const tickAtStart = await report_definition.updatedAtSyncTick;

      // act
      await umzug.down({ to: '1692710205000-allowDisablingSyncTrigger' });
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
      await umzug.up({ step: 1 });

      // make sure running migration doesn't affect normal sync tick update
      await report_definition.update({ name: 'lorem ipsum' });
      await report_definition.reload();
      const tickAfterUpdate = await report_definition.updatedAtSyncTick;

      // assertions
      expect(tickAtStart).toBe('1');
      expect(tickAfterUpdate).toBe('2');
    }, 30000);
  });
});
