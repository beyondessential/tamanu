import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';

import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { programImporter } from '../../app/admin/programImporter';
import { createTestContext } from '../utilities';
import { makeRoleWithPermissions } from '../permissions';
import './matchers';

// the importer can take a little while
vi.setConfig({ testTimeout: 60000 });

const PROGRAM_FILE = './__tests__/importers/programs-valid.xlsx';

describe('Import transaction - sync tick lock', () => {
  let ctx;
  let models;
  let sequelize;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    sequelize = ctx.store.sequelize;
  });

  beforeEach(async () => {
    const { Program, Survey, ProgramDataElement, SurveyScreenComponent } = models;
    await SurveyScreenComponent.destroy({ where: {}, force: true });
    await ProgramDataElement.destroy({ where: {}, force: true });
    await Survey.destroy({ where: {}, force: true });
    await Program.destroy({ where: {}, force: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await ctx.close();
  });

  const waitForQueryBlockedOnLock = async queryFragment => {
    await vi.waitFor(
      async () => {
        const [rows] = await sequelize.query(
          `SELECT 1 FROM pg_stat_activity
          WHERE wait_event_type = 'Lock' AND query LIKE :pattern`,
          { replacements: { pattern: `%${queryFragment}%` } },
        );
        expect(rows).toHaveLength(1);
      },
      { timeout: 10000, interval: 50 },
    );
  };

  it('retries an import whose sync tick lock lost a race with a sync session', async () => {
    // Stand in for a sync session moving the tick: hold the row locked in another transaction, so
    // the import queues behind it, then commit. A serialisable transaction whose locked row was
    // updated since its snapshot fails with a serialisation failure.
    const syncSession = await sequelize.transaction();
    await sequelize.query(
      `UPDATE local_system_facts SET value = (value::bigint + 2)::text WHERE key = :key`,
      { replacements: { key: FACT_CURRENT_SYNC_TICK }, transaction: syncSession },
    );

    const importResult = importerTransaction({
      importer: programImporter,
      file: PROGRAM_FILE,
      models,
      checkPermission: () => true,
    });
    await waitForQueryBlockedOnLock('local_system_facts');
    await syncSession.commit();

    const { didntSendReason, errors, stats } = await importResult;
    expect(errors).toEqual([]);
    expect(didntSendReason).toBeUndefined();
    expect(stats).toMatchObject({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
    });
  });

  it('reports a failure from before the importer ran instead of a missing permission check', async () => {
    const app = await ctx.baseApp.asRole('practitioner');
    await models.Permission.destroy({ where: { roleId: 'practitioner' }, force: true });
    await models.Role.destroy({ where: { id: 'practitioner' }, force: true });
    await makeRoleWithPermissions(models, 'practitioner', [
      { verb: 'write', noun: 'Program' },
      { verb: 'create', noun: 'Program' },
      { verb: 'write', noun: 'Survey' },
      { verb: 'create', noun: 'Survey' },
    ]);
    vi.spyOn(models.LocalSystemFact, 'findAll').mockRejectedValueOnce(
      new Error('database unavailable'),
    );

    const result = await app
      .post('/v1/admin/import/program')
      .attach('file', PROGRAM_FILE)
      .field('includedDataTypes', 'program');

    expect(result).toHaveSucceeded();
    const { didntSendReason, errors } = result.body;
    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('database unavailable');
  });
});
