import { SYNC_PHASES } from '@tamanu/constants';
import {
  FACT_CURRENT_SYNC_TICK,
  FACT_INITIAL_SYNC_PHASE,
  FACT_INITIAL_SYNC_PULLED_UP_TO,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
} from '@tamanu/constants/facts';
import { fake } from '@tamanu/fake-data/fake';

import { FacilitySyncManager } from '../../app/sync/FacilitySyncManager';
import {
  completeInitialSyncPhase,
  getInitialSyncPhase,
  getPhaseCatchUpSince,
} from '../../app/sync/initialSyncPhase';
import { createTestContext } from '../utilities';

describe('initial sync phases', () => {
  let ctx;
  let models;
  let sequelize;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, null);
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, null);
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PULLED_UP_TO, null);
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '10');
  });

  describe('getInitialSyncPhase', () => {
    it('starts a facility that has never pulled at the first phase', async () => {
      expect(await getInitialSyncPhase(models)).toBe(SYNC_PHASES.BOOT);

      // and remembers it, so a restart resumes rather than restarting the phase sequence
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PHASE)).toBe(`${SYNC_PHASES.BOOT}`);
    });

    it('resumes at the phase the facility is up to', async () => {
      await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, `${SYNC_PHASES.CATALOGUE}`);

      expect(await getInitialSyncPhase(models)).toBe(SYNC_PHASES.CATALOGUE);
    });

    it('does not phase a sync for a facility that has pulled before', async () => {
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, '20');

      expect(await getInitialSyncPhase(models)).toBe(null);
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PHASE)).toBe(null);
    });
  });

  describe('completeInitialSyncPhase', () => {
    it('advances to the next phase without setting a pull cursor', async () => {
      const next = await completeInitialSyncPhase(models, SYNC_PHASES.BOOT, 300);

      expect(next).toBe(SYNC_PHASES.CATALOGUE);
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PHASE)).toBe(
        `${SYNC_PHASES.CATALOGUE}`,
      );
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PULLED_UP_TO)).toBe('300');
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe(null);
    });

    it('hands the tick it reached to the phase after it', async () => {
      await completeInitialSyncPhase(models, SYNC_PHASES.BOOT, 300);
      expect(await getPhaseCatchUpSince(models)).toBe(300);

      await completeInitialSyncPhase(models, SYNC_PHASES.CATALOGUE, 350);
      expect(await getPhaseCatchUpSince(models)).toBe(350);
    });

    it('starts the first phase from the beginning of the sync timeline', async () => {
      expect(await getPhaseCatchUpSince(models)).toBe(-1);
    });

    it('sets the pull cursor to the last phase tick and clears its phase state', async () => {
      await completeInitialSyncPhase(models, SYNC_PHASES.BOOT, 300);
      await completeInitialSyncPhase(models, SYNC_PHASES.CATALOGUE, 350);
      const next = await completeInitialSyncPhase(models, SYNC_PHASES.RECORDS, 400);

      expect(next).toBe(null);
      // every table is current as of the last phase's tick, because each phase caught the earlier
      // ones up from where the phase before it stopped
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe('400');
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PHASE)).toBe(null);
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PULLED_UP_TO)).toBe(null);
    });
  });

  describe('running the phases', () => {
    const ROLE_ID = 'phase-test-role';
    const PATIENT_ID = 'phase-test-patient';

    // ticks advance across the phases, as central's clock does
    const PULL_UNTIL = {
      [SYNC_PHASES.BOOT]: 300,
      [SYNC_PHASES.CATALOGUE]: 350,
      [SYNC_PHASES.RECORDS]: 400,
    };

    const recordsForPhase = phase => {
      if (phase === SYNC_PHASES.BOOT) {
        return [
          {
            id: '1',
            sortOrder: 1,
            recordType: 'roles',
            recordId: ROLE_ID,
            isDeleted: false,
            data: { ...fake(models.Role, { id: ROLE_ID }), updatedAtSyncTick: -1 },
          },
        ];
      }
      if (phase === SYNC_PHASES.CATALOGUE) {
        return [
          {
            id: '1',
            sortOrder: 1,
            recordType: 'patients',
            recordId: PATIENT_ID,
            isDeleted: false,
            data: { ...fake(models.Patient, { id: PATIENT_ID }), updatedAtSyncTick: -1 },
          },
        ];
      }
      return [];
    };

    // a central server that serves whichever phase the facility asks for, and records what it asked
    const buildCentralServer = () => {
      const pullsByPhase = [];
      let phase = SYNC_PHASES.BOOT;

      return {
        pullsByPhase,
        streaming: () => false,
        startSyncSession: jest
          .fn()
          .mockImplementation(async () => ({ sessionId: 'phase-test-session', startedAtTick: 20 })),
        endSyncSession: jest.fn().mockResolvedValue({}),
        markSessionErrored: jest.fn().mockResolvedValue({}),
        completePush: jest.fn().mockResolvedValue({}),
        push: jest.fn().mockResolvedValue({}),
        initiatePull: jest.fn().mockImplementation(async (_sessionId, pullParams) => {
          // a phase is identified by the tables it asks to pull from the start, so a retried phase is
          // served the same records again
          const { tablesForFullResync } = pullParams;
          phase = tablesForFullResync.includes('encounters')
            ? SYNC_PHASES.RECORDS
            : tablesForFullResync.includes('patients')
              ? SYNC_PHASES.CATALOGUE
              : SYNC_PHASES.BOOT;
          pullsByPhase.push({ phase, ...pullParams });
          return {
            totalToPull: recordsForPhase(phase).length,
            pullUntil: PULL_UNTIL[phase],
          };
        }),
        pull: jest.fn().mockImplementation(async () => recordsForPhase(phase)),
      };
    };

    // drives the chain of phases the manager kicks off for itself
    const runAllPhases = async syncManager => {
      await syncManager.triggerSync('test');
      while (syncManager.initialSyncContinuation) {
        const continuation = syncManager.initialSyncContinuation;
        syncManager.initialSyncContinuation = null;
        await continuation;
      }
    };

    afterEach(async () => {
      await models.Patient.destroy({ where: { id: PATIENT_ID }, force: true });
      await models.Role.destroy({ where: { id: ROLE_ID }, force: true });
    });

    it('runs one phase per sync, each pulling its own tables from the start', async () => {
      const centralServer = buildCentralServer();
      const syncManager = new FacilitySyncManager({ models, sequelize, centralServer });

      await runAllPhases(syncManager);

      expect(centralServer.pullsByPhase.map(({ phase }) => phase)).toEqual([
        SYNC_PHASES.BOOT,
        SYNC_PHASES.CATALOGUE,
        SYNC_PHASES.RECORDS,
      ]);

      const [boot, catalogue, records] = centralServer.pullsByPhase;

      // a phase pulls its own tables from the beginning of the sync timeline
      expect(boot.tablesForFullResync).toEqual(
        expect.arrayContaining(['facilities', 'users', 'roles']),
      );
      expect(boot.tablesForFullResync).not.toContain('patients');
      expect(catalogue.tablesForFullResync).toContain('patients');
      expect(catalogue.tablesForFullResync).not.toContain('encounters');
      expect(records.tablesForFullResync).toContain('encounters');

      // and every phase declares itself part of an initial sync, so central keeps the
      // deployment-wide lab request filter off throughout
      expect(centralServer.pullsByPhase.map(({ isInitialSync }) => isInitialSync)).toEqual([
        true,
        true,
        true,
      ]);
    });

    it('catches earlier phases up from where the phase before it stopped', async () => {
      // this is the foreign key hole: a record in a later phase can reference one created on central
      // after an earlier phase was snapshotted, so each phase re-pulls the earlier tables from the
      // tick the phase before it reached
      const centralServer = buildCentralServer();
      const syncManager = new FacilitySyncManager({ models, sequelize, centralServer });

      await runAllPhases(syncManager);

      const [boot, catalogue, records] = centralServer.pullsByPhase;

      // the first phase has nothing before it to catch up
      expect(boot.since).toBe(-1);
      expect(boot.tablesToInclude).toEqual(boot.tablesForFullResync);

      // later phases resume the earlier tables from the previous phase's tick...
      expect(catalogue.since).toBe(PULL_UNTIL[SYNC_PHASES.BOOT]);
      expect(records.since).toBe(PULL_UNTIL[SYNC_PHASES.CATALOGUE]);

      // ...and ask for them alongside their own
      expect(catalogue.tablesToInclude).toEqual(expect.arrayContaining(['users', 'patients']));
      expect(records.tablesToInclude).toEqual(
        expect.arrayContaining(['users', 'patients', 'encounters']),
      );
    });

    it('saves each phase as it lands, and only sets the cursor when the last one does', async () => {
      const centralServer = buildCentralServer();
      const syncManager = new FacilitySyncManager({ models, sequelize, centralServer });

      // runSync performs a single phase, so this stops after the boot phase rather than chaining
      // straight on to the next one
      expect(await syncManager.runSync()).toMatchObject({ nextPhase: SYNC_PHASES.CATALOGUE });

      expect(await models.Role.findByPk(ROLE_ID)).not.toBe(null);
      expect(await models.Patient.findByPk(PATIENT_ID)).toBe(null);
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe(null);
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PHASE)).toBe(
        `${SYNC_PHASES.CATALOGUE}`,
      );

      await runAllPhases(syncManager);

      expect(await models.Patient.findByPk(PATIENT_ID)).not.toBe(null);
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe('400');
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PHASE)).toBe(null);
    });

    it('retries the phase that failed and keeps the phases before it', async () => {
      const centralServer = buildCentralServer();
      const syncManager = new FacilitySyncManager({ models, sequelize, centralServer });

      await syncManager.runSync();

      // the catalogue phase fails once
      centralServer.pull.mockRejectedValueOnce(new Error('connection lost'));
      await expect(syncManager.runSync()).rejects.toThrow('connection lost');

      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PHASE)).toBe(
        `${SYNC_PHASES.CATALOGUE}`,
      );
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PULLED_UP_TO)).toBe('300');
      expect(await models.Patient.findByPk(PATIENT_ID)).toBe(null);

      await runAllPhases(syncManager);

      expect(await models.Patient.findByPk(PATIENT_ID)).not.toBe(null);
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe('400');
    });

    it('does not phase a sync once the initial sync is complete', async () => {
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, '200');
      const centralServer = buildCentralServer();
      centralServer.initiatePull = jest.fn().mockImplementation(async (_sessionId, pullParams) => {
        expect(pullParams).toEqual({ since: '200' });
        return { totalToPull: 0, pullUntil: 500 };
      });
      const syncManager = new FacilitySyncManager({ models, sequelize, centralServer });

      await syncManager.triggerSync('test');

      expect(centralServer.initiatePull).toHaveBeenCalledTimes(1);
      expect(syncManager.initialSyncContinuation).toBe(null);
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe('500');
    });
  });
});
