import { CURRENT_SYNC_TIME_KEY } from 'shared/sync/constants';
import { SYNC_SESSION_DIRECTION } from 'shared/sync';
import { fake, fakeUser } from 'shared/test-helpers/fake';
import { createDummyEncounter } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

describe('CentralSyncManager', () => {
  let ctx;
  let models;
  let centralSyncManager;
  let CentralSyncManager;

  const initializeCentralSyncManager = () => {
    // Have to load test function within test scope so that we can mock dependencies per test case
    ({ CentralSyncManager } = require('../../app/sync/CentralSyncManager'));
    centralSyncManager = new CentralSyncManager(ctx);
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  afterAll(() => {
    centralSyncManager.close();
    ctx.close();
  });

  beforeEach(async () => {
    initializeCentralSyncManager();
  });

  afterEach(() => {
    CentralSyncManager.restoreConfig();
  });

  describe('startSession', () => {
    it('creates a new session', async () => {
      const { sessionId } = await centralSyncManager.startSession();
      const syncSession = await models.SyncSession.findOne({ where: { id: sessionId } });
      expect(syncSession).not.toBeUndefined();
    });

    it('tick-tocks the global clock', async () => {
      const { tick } = await centralSyncManager.startSession();
      const localSystemFact = await models.LocalSystemFact.findOne({
        where: { key: CURRENT_SYNC_TIME_KEY },
      });
      expect(parseInt(localSystemFact.value, 10)).toBe(tick + 1);
    });

    it('allows concurrent sync sessions', async () => {
      const { sessionId: sessionId1 } = await centralSyncManager.startSession();
      const { sessionId: sessionId2 } = await centralSyncManager.startSession();

      const syncSession1 = await models.SyncSession.findOne({ where: { id: sessionId1 } });
      const syncSession2 = await models.SyncSession.findOne({ where: { id: sessionId2 } });

      expect(syncSession1).not.toBeUndefined();
      expect(syncSession2).not.toBeUndefined();
    });
  });

  describe('connectToSession', () => {
    it('allows connecting to an existing session', async () => {
      const { sessionId } = await centralSyncManager.startSession();
      const syncSession = await centralSyncManager.connectToSession(sessionId);
      expect(syncSession).not.toBeUndefined();
    });
  });

  describe('endSession', () => {
    it('set completedAt when ending an existing session', async () => {
      const { sessionId } = await centralSyncManager.startSession();
      await centralSyncManager.endSession(sessionId);
      const syncSession2 = await models.SyncSession.findOne({ where: { id: sessionId } });
      expect(syncSession2.completedAt).not.toBeUndefined();
    });

    it('throws error when connect to a session that already ended', async () => {
      const { sessionId } = await centralSyncManager.startSession();
      await centralSyncManager.endSession(sessionId);
      await expect(centralSyncManager.connectToSession(sessionId)).rejects.toThrow();
    });
  });

  describe('getOutgoingChanges', () => {
    beforeEach(async () => {
      jest.resetModules();
    });

    it('returns all the outgoing changes', async () => {
      const facility = await models.Facility.create(fake(models.Facility));
      const { sessionId } = await centralSyncManager.startSession();
      await centralSyncManager.setupSnapshot(
        sessionId,
        {
          since: -1,
          facilityId: facility.id,
        },
        () => true,
      );

      const changes = await centralSyncManager.getOutgoingChanges(sessionId, {
        limit: 10,
      });
      expect(changes.length).toBe(1);
    });

    it('returns all encounters for marked-for-sync patients', async () => {
      const OLD_SYNC_TICK = 10;
      const NEW_SYNC_TICK = 20;

      // ~ ~ ~ Set up old data
      await models.LocalSystemFact.set('currentSyncTick', OLD_SYNC_TICK);
      const patient1 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const patient2 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const facility = await models.Facility.create({
        ...fake(models.Facility),
      });
      await models.User.create(fakeUser());
      await models.Department.create({
        ...fake(models.Department),
        facilityId: facility.id,
      });
      await models.Location.create({
        ...fake(models.Location),
        facilityId: facility.id,
      });
      const encounter1 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient1.id,
      });
      const encounter2 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient2.id,
      });

      await models.LocalSystemFact.set('currentSyncTick', NEW_SYNC_TICK);

      // ~ ~ ~ Set up data for marked for sync patients
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patient1.id,
        facilityId: facility.id,
      });
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patient2.id,
        facilityId: facility.id,
      });

      const { sessionId } = await centralSyncManager.startSession();

      await centralSyncManager.setupSnapshot(
        sessionId,
        {
          since: 15,
          facilityId: facility.id,
        },
        () => true,
      );

      const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
      const encounterIds = outgoingChanges
        .filter(c => c.recordType === 'encounters')
        .map(c => c.recordId);

      // Assert if outgoing changes contain the encounters (fully) for the marked for sync patients
      expect(encounterIds).toEqual(expect.arrayContaining([encounter1.id, encounter2.id]));
    });
  });

  describe('setupSnapshot', () => {
    beforeEach(async () => {
      jest.resetModules();
    });

    describe('invokes with correct session config', () => {
      it('sets up snapshots with syncAllEncountersForTheseVaccines = true in sessionConfig when it is turned on and client is mobile', async () => {
        const facility = await models.Facility.create(fake(models.Facility));
        const { sessionId } = await centralSyncManager.startSession();

        jest.doMock('../../app/sync/snapshotOutgoingChanges', () => ({
          snapshotOutgoingChanges: jest.fn(),
        }));

        initializeCentralSyncManager();
        CentralSyncManager.overrideConfig({
          sync: { syncAllEncountersForTheseVaccines: ['test1', 'test2'] },
        });

        const { snapshotOutgoingChanges } = require('../../app/sync/snapshotOutgoingChanges');
        await centralSyncManager.setupSnapshot(
          sessionId,
          {
            since: 15,
            facilityId: facility.id,
            isMobile: true,
          },
          () => true,
        );

        expect(snapshotOutgoingChanges).toBeCalledWith(
          expect.any(Object),
          15,
          expect.any(Array),
          sessionId,
          facility.id,
          expect.objectContaining({ syncAllEncountersForTheseVaccines: ['test1', 'test2'] }),
        );
      });

      it('sets up snapshots with syncAllEncountersForTheseVaccines = false in sessionConfig when it is turned on but client is not mobile', async () => {
        const facility = await models.Facility.create(fake(models.Facility));
        const { sessionId } = await centralSyncManager.startSession();

        jest.doMock('../../app/sync/snapshotOutgoingChanges', () => ({
          snapshotOutgoingChanges: jest.fn(),
        }));

        initializeCentralSyncManager();
        CentralSyncManager.overrideConfig({
          sync: { syncAllEncountersForTheseVaccines: ['test1', 'test2'] },
        });

        const { snapshotOutgoingChanges } = require('../../app/sync/snapshotOutgoingChanges');
        await centralSyncManager.setupSnapshot(
          sessionId,
          {
            since: 15,
            facilityId: facility.id,
            isMobile: false,
          },
          () => true,
        );

        expect(snapshotOutgoingChanges).toBeCalledWith(
          expect.any(Object),
          15,
          expect.any(Array),
          sessionId,
          facility.id,
          expect.objectContaining({ syncAllEncountersForTheseVaccines: [] }),
        );
      });
    });

    it('fully syncs marked-for-sync patients by detecting patient_facility records', async () => {
      const OLD_SYNC_TICK = 10;
      const NEW_SYNC_TICK = 20;

      await models.LocalSystemFact.set('currentSyncTick', OLD_SYNC_TICK);

      const facility = await models.Facility.create(fake(models.Facility));
      const patient1 = await models.Patient.create(fake(models.Patient));
      const patient2 = await models.Patient.create(fake(models.Patient));

      await models.LocalSystemFact.set('currentSyncTick', NEW_SYNC_TICK);

      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patient1.id,
        facilityId: facility.id,
      });
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patient2.id,
        facilityId: facility.id,
      });

      jest.doMock('../../app/sync/snapshotOutgoingChanges', () => ({
        snapshotOutgoingChanges: jest.fn(),
      }));

      initializeCentralSyncManager();

      const { snapshotOutgoingChanges } = require('../../app/sync/snapshotOutgoingChanges');
      const { sessionId } = await centralSyncManager.startSession();

      await centralSyncManager.setupSnapshot(
        sessionId,
        {
          since: 15,
          facilityId: facility.id,
        },
        () => true,
      );

      expect(snapshotOutgoingChanges).toBeCalledWith(
        expect.any(Object),
        -1,
        expect.arrayContaining([patient1.id, patient2.id]),
        sessionId,
        facility.id,
        expect.any(Object),
      );
    });
  });

  describe('addIncomingChanges', () => {
    beforeEach(async () => {
      jest.resetModules();
    });

    it('inserts incoming changes into snapshots', async () => {
      const patient1 = await models.Patient.create(fake(models.Patient));
      const patient2 = await models.Patient.create(fake(models.Patient));
      const changes = [patient1, patient2].map(r => ({
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: !!r.deletedAt,
        recordType: 'patients',
        recordId: r.id,
        data: r.dataValues,
      }));

      jest.doMock('shared/sync', () => ({
        ...jest.requireActual('shared/sync'),
        insertSnapshotRecords: jest.fn(),
      }));

      initializeCentralSyncManager();

      const { insertSnapshotRecords } = require('shared/sync');
      const { sessionId } = await centralSyncManager.startSession();
      await centralSyncManager.addIncomingChanges(sessionId, changes, {
        pushedSofar: 0,
        totalToPush: 2,
      });
      const incomingChanges = changes.map(c => ({
        ...c,
        direction: SYNC_SESSION_DIRECTION.INCOMING,
        updatedAtByFieldSum: null,
      }));

      expect(insertSnapshotRecords).toBeCalledTimes(1);
      expect(insertSnapshotRecords).toBeCalledWith(
        ctx.store.sequelize,
        sessionId,
        expect.arrayContaining(incomingChanges),
      );
    });
  });
});
