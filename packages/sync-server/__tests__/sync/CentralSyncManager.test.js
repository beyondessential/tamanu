import { fake } from 'shared/test-helpers/fake';
import { createDummyPatient } from 'shared/demoData/patients';
import { sleepAsync } from 'shared/utils/sleepAsync';

import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { createTestContext } from '../utilities';
/*
  There was not enough time to actually write these tests but will
  leave general notes for the future here.

  - Probably a good idea to call .restoreConfig afterEach test (see line X).
  - If you needed to overwrite config just call CentralSyncManager.overrideConfig(customConfigObject).
  - Initializing the CentralSyncManager needs the app context or a mock like:
      const syncManager = new CentralSyncManager({
        store: {
          models: {
            SyncSession: {
              findAll: async () => [],
            },
          },
          sequelize: {},
        },
        onClose: () => {},
      });
*/

describe('CentralSyncManager', () => {
  let ctx;
  let models;
  let sequelize;

  const waitForSession = async (centralSyncManager, sessionId) => {
    let ready = false;
    while (!ready) {
      ready = await centralSyncManager.checkSessionReady(sessionId);
    }
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
  });
  afterAll(() => ctx.close());

  describe('startSession', () => {
    it.todo('creates a new session');
    it.todo('tick-tocks the global clock');
    it.todo('allows concurrent sync sessions');
  });

  describe('connectToSession', () => {
    it.todo('all');
  });

  describe('endSession', () => {
    it.todo('all');
  });

  describe('setupSnapshotForPull', () => {
    it('should wait until all the in-flight transactions using previous ticks (within the range of syncing) to finish and snapshot them for outgoing changes', async () => {
      const OLD_SYNC_TICK_1 = '4';
      const OLD_SYNC_TICK_2 = '6';
      const OLD_SYNC_TICK_3 = '8';
      const CURRENT_SYNC_TICK = '10';
      const facility = await models.Facility.create({
        ...fake(models.Facility),
      });

      const centralSyncManager = new CentralSyncManager(ctx);
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      // Insert PATIENT 1 using an old sync tick and don't commit the transaction yet
      await models.LocalSystemFact.set('currentSyncTick', OLD_SYNC_TICK_1);
      const transactionForPatient1 = await sequelize.transaction();
      const patient1 = await models.Patient.create(createDummyPatient(), {
        transaction: transactionForPatient1,
      });

      // Insert PATIENT 2 using an old sync tick and don't commit the transaction yet
      await models.LocalSystemFact.set('currentSyncTick', OLD_SYNC_TICK_2);
      const transactionForPatient2 = await sequelize.transaction();
      const patient2 = await models.Patient.create(createDummyPatient(), {
        transaction: transactionForPatient2,
      });

      // Insert PATIENT 3 using an old sync tick and don't commit the transaction yet
      await models.LocalSystemFact.set('currentSyncTick', OLD_SYNC_TICK_3);
      const transactionForPatient3 = await sequelize.transaction();
      const patient3 = await models.Patient.create(createDummyPatient(), {
        transaction: transactionForPatient3,
      });

      // Insert PATIENT 4 using the latest sync tick and commit the transaction
      await models.LocalSystemFact.set('currentSyncTick', CURRENT_SYNC_TICK);
      const patient4 = await models.Patient.create(createDummyPatient());

      const snapshotForPullPromise = centralSyncManager.setupSnapshotForPull(
        sessionId,
        {
          since: 2,
          facilityId: facility.id,
        },
        () => true,
      );

      // Wait for the snapshot process to go through
      await sleepAsync(200);

      // Commit the transaction for patient 3 (the last inserted patient) first, then 2, then 1
      // so that we can also test an edge case when the previous transactions were still not committed
      await transactionForPatient3.commit();
      await sleepAsync(200);
      await transactionForPatient2.commit();
      await sleepAsync(200);
      await transactionForPatient1.commit();
      await snapshotForPullPromise;

      const changes = await centralSyncManager.getOutgoingChanges(sessionId, {
        limit: 10,
      });

      expect(changes).toHaveLength(4);

      expect(changes.map(c => c.data.id).sort()).toEqual(
        [patient1.id, patient2.id, patient3.id, patient4.id].sort(),
      );
    });
  });

  describe('addIncomingChanges', () => {
    it.todo('all');
  });
});
