import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  waitForPushCompleted,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

describe('CentralSyncManager', () => {
  let ctx;
  let models;
  let sequelize;

  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.Setting.set('audit.changes.enabled', false);
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, null);
    await models.SyncLookup.truncate({ force: true });
    await models.DebugLog.truncate({ force: true });
  });

  afterAll(() => ctx.close());

  describe('syncDeviceTick', () => {
    beforeEach(async () => {
      jest.resetModules();
    });

    it('correctly sets the sync device tick for a sync', async () => {
      const INITIAL_SYNC_TICK = '16';
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, INITIAL_SYNC_TICK);
      const facility = await models.Facility.create(fake(models.Facility));

      // Existing patient
      const patient = await models.Patient.create({
        ...fake(models.Patient),
        displayId: 'DEF',
      });

      expect(patient.updatedAtSyncTick).toBe(INITIAL_SYNC_TICK);

      // Patient data for pushing (not inserted yet)
      const updatedPatientData = {
        ...patient.dataValues,
        firstName: 'Changed',
      };

      const changes = [
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'patients',
          recordId: updatedPatientData.id,
          data: updatedPatientData,
        },
      ];

      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession({ deviceId: facility.id });
      await waitForSession(centralSyncManager, sessionId);

      // Push the change
      await centralSyncManager.addIncomingChanges(sessionId, changes);
      await centralSyncManager.completePush(sessionId, facility.id);
      await waitForPushCompleted(centralSyncManager, sessionId);

      await patient.reload();

      // Check if patient updated and sync device tick is created and is unique
      expect(patient.displayId).toBe(updatedPatientData.displayId);
      expect(Number.parseInt(patient.updatedAtSyncTick, 10)).toBeGreaterThan(
        Number.parseInt(INITIAL_SYNC_TICK, 10),
      );
      expect(Number.parseInt(patient.updatedAtSyncTick, 10)).toBeLessThan(
        Number.parseInt(await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK), 10),
      );
      const syncDeviceTick = await models.SyncDeviceTick.findByPk(patient.updatedAtSyncTick);
      expect(syncDeviceTick.deviceId).toBe(facility.id);
    });

    it('prevents concurrent edits from sharing the same sync tick as the device sync tick', async () => {
      let tickTock;
      let unblockTickTock;
      const blockTickTockPromise = new Promise(resolve => {
        unblockTickTock = resolve;
      });

      let flagTickTockBlocked;
      const isTickTockBlockedPromise = new Promise(resolve => {
        flagTickTockBlocked = resolve;
      });

      const blockTickTock = () => {
        sequelize.transaction(async () => {
          await tickTock();
          await blockTickTockPromise;
        });
        flagTickTockBlocked();
      };
      const originalUpdateSnapshotRecords =
        jest.requireActual('@tamanu/database/sync').updateSnapshotRecords;
      const mockUpdateSnapshotRecords = jest.fn().mockImplementation(async (...args) => {
        // Block tickTock before completing the persist transaction so that we can test if concurrent edits share the same sync tick
        blockTickTock();
        return originalUpdateSnapshotRecords(...args);
      });

      jest.doMock('@tamanu/database/sync', () => ({
        ...jest.requireActual('@tamanu/database/sync'),
        updateSnapshotRecords: mockUpdateSnapshotRecords,
      }));

      const INITIAL_SYNC_TICK = '16';
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, INITIAL_SYNC_TICK);
      const facility = await models.Facility.create(fake(models.Facility));

      // Existing patient
      const patient = await models.Patient.create({
        ...fake(models.Patient),
        displayId: 'DEF',
      });

      expect(patient.updatedAtSyncTick).toBe(INITIAL_SYNC_TICK);

      // Patient data for pushing (not inserted yet)
      const updatedPatientData = {
        ...patient.dataValues,
        firstName: 'Changed',
      };

      const changes = [
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'patients',
          recordId: updatedPatientData.id,
          data: updatedPatientData,
        },
      ];

      const centralSyncManager = initializeCentralSyncManager();
      tickTock = centralSyncManager.tickTockGlobalClock.bind(centralSyncManager);
      const { sessionId } = await centralSyncManager.startSession({ deviceId: facility.id });
      await waitForSession(centralSyncManager, sessionId);

      // Push the change
      await centralSyncManager.addIncomingChanges(sessionId, changes);
      centralSyncManager.completePush(sessionId, facility.id);

      // Mid push, make a concurrent edit to see if it shares the same sync tick as the device sync tick
      await isTickTockBlockedPromise;
      const concurrentEdit = await models.Patient.create({
        ...fake(models.Patient),
        displayId: 'GHI',
      });
      unblockTickTock();
      await waitForPushCompleted(centralSyncManager, sessionId);

      await patient.reload();

      // Check if patient updated and the concurrent edit has a different sync tick
      expect(patient.displayId).toBe(updatedPatientData.displayId);
      expect(patient.updatedAtSyncTick).not.toBe(concurrentEdit.updatedAtSyncTick);
      const syncDeviceTick = await models.SyncDeviceTick.findByPk(patient.updatedAtSyncTick);
      expect(syncDeviceTick.deviceId).toBe(facility.id);
    });
  });
});
