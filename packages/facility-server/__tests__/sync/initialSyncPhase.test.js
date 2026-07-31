import { SYNC_PHASES } from '@tamanu/constants';
import {
  FACT_CURRENT_SYNC_TICK,
  FACT_INITIAL_SYNC_PHASE,
  FACT_INITIAL_SYNC_PULL_FLOOR,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
} from '@tamanu/constants/facts';
import { fake } from '@tamanu/fake-data/fake';

import { FacilitySyncManager } from '../../app/sync/FacilitySyncManager';
import { completeInitialSyncPhase, getInitialSyncPhase } from '../../app/sync/initialSyncPhase';
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
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PULL_FLOOR, null);
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
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PULL_FLOOR)).toBe('300');
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe(null);
    });

    it('keeps the earliest tick of the phases completed so far', async () => {
      await completeInitialSyncPhase(models, SYNC_PHASES.BOOT, 300);
      await completeInitialSyncPhase(models, SYNC_PHASES.CATALOGUE, 200);

      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PULL_FLOOR)).toBe('200');
    });

    it('sets the pull cursor to the earliest tick and clears its phase state on the last phase', async () => {
      await completeInitialSyncPhase(models, SYNC_PHASES.BOOT, 300);
      await completeInitialSyncPhase(models, SYNC_PHASES.CATALOGUE, 200);
      const next = await completeInitialSyncPhase(models, SYNC_PHASES.RECORDS, 400);

      expect(next).toBe(null);
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe('200');
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PHASE)).toBe(null);
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PULL_FLOOR)).toBe(null);
    });
  });

  describe('running the phases', () => {
    const ROLE_ID = 'phase-test-role';
    const PATIENT_ID = 'phase-test-patient';

    // pullUntil differs per phase, and the earliest is neither the first nor the last, so a cursor
    // that took any single phase's tick rather than the earliest would fail this
    const PULL_UNTIL = {
      [SYNC_PHASES.BOOT]: 300,
      [SYNC_PHASES.CATALOGUE]: 200,
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
        initiatePull: jest.fn().mockImplementation(async (_sessionId, since, tablesToInclude) => {
          // the phase is whatever this pull asked for, so a retried phase is served again
          phase = tablesToInclude.includes('patients')
            ? SYNC_PHASES.CATALOGUE
            : tablesToInclude.includes('roles')
              ? SYNC_PHASES.BOOT
              : SYNC_PHASES.RECORDS;
          pullsByPhase.push({ phase, since, tablesToInclude });
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

    it('runs one phase per sync, each pulling only its own tables', async () => {
      const centralServer = buildCentralServer();
      const syncManager = new FacilitySyncManager({ models, sequelize, centralServer });

      await runAllPhases(syncManager);

      expect(centralServer.pullsByPhase.map(({ phase }) => phase)).toEqual([
        SYNC_PHASES.BOOT,
        SYNC_PHASES.CATALOGUE,
        SYNC_PHASES.RECORDS,
      ]);

      const [boot, catalogue, records] = centralServer.pullsByPhase;
      expect(boot.tablesToInclude).toEqual(
        expect.arrayContaining(['facilities', 'users', 'roles']),
      );
      expect(boot.tablesToInclude).not.toContain('patients');
      expect(catalogue.tablesToInclude).toContain('patients');
      expect(catalogue.tablesToInclude).not.toContain('encounters');
      expect(records.tablesToInclude).toContain('encounters');

      // every phase pulls from the beginning of the sync timeline
      expect(centralServer.pullsByPhase.map(({ since }) => since)).toEqual([-1, -1, -1]);
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
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe('200');
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
      expect(await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PULL_FLOOR)).toBe('300');
      expect(await models.Patient.findByPk(PATIENT_ID)).toBe(null);

      await runAllPhases(syncManager);

      expect(await models.Patient.findByPk(PATIENT_ID)).not.toBe(null);
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe('200');
    });

    it('does not phase a sync once the initial sync is complete', async () => {
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, '200');
      const centralServer = buildCentralServer();
      centralServer.initiatePull = jest
        .fn()
        .mockImplementation(async (_sessionId, since, tablesToInclude) => {
          expect(tablesToInclude).toBe(undefined);
          expect(since).toBe('200');
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
