import { expect, beforeAll, describe, it } from '@jest/globals';
import { Transaction } from 'sequelize';

import { fake, fakeReferenceData, withErrorShown } from 'shared/test-helpers';
import { getModelsForDirection, COLUMNS_EXCLUDED_FROM_SYNC } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { sleepAsync } from 'shared/utils/sleepAsync';
import { fakeUUID } from 'shared/utils/generateId';

import { createTestContext } from '../utilities';
import { snapshotOutgoingChanges } from '../../app/sync/snapshotOutgoingChanges';

const readOnlyConfig = readOnly => ({ sync: { readOnly } });

describe('snapshotOutgoingChanges', () => {
  let ctx;
  let models;
  let outgoingModels;
  const simplestSessionConfig = {
    syncAllLabRequests: false,
    syncAllEncountersForTheseVaccines: [],
    isMobile: false,
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    outgoingModels = getModelsForDirection(models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);
  });

  afterAll(() => ctx.close());

  it(
    'if in readOnly mode returns 0',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;
      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      await ReferenceData.create(fakeReferenceData());
      const tock = await LocalSystemFact.increment('currentSyncTick', 2);

      const result = await snapshotOutgoingChanges.overrideConfig(
        outgoingModels,
        tock - 1,
        [],
        syncSession.id,
        '',
        simplestSessionConfig,
        readOnlyConfig(true),
      );

      expect(result).toEqual(0);
    }),
  );

  it(
    'if nothing changed returns 0',
    withErrorShown(async () => {
      const { LocalSystemFact } = models;
      const tock = await LocalSystemFact.increment('currentSyncTick', 2);

      const result = await snapshotOutgoingChanges(
        outgoingModels,
        tock - 1,
        [],
        fakeUUID(),
        '',
        simplestSessionConfig,
      );
      expect(result).toEqual(0);
    }),
  );

  it(
    'returns serialised records (excluding metadata columns)',
    withErrorShown(async () => {
      const { SyncSession, SyncSessionRecord, LocalSystemFact, ReferenceData } = models;
      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      const tock = await LocalSystemFact.increment('currentSyncTick', 2);
      await ReferenceData.create(fakeReferenceData());

      const result = await snapshotOutgoingChanges(
        outgoingModels,
        tock - 1,
        [],
        syncSession.id,
        '',
        simplestSessionConfig,
      );
      expect(result).toEqual(1);

      const [syncRecord] = await SyncSessionRecord.findAll({
        where: { sessionId: syncSession.id },
      });
      expect(
        Object.keys(syncRecord.data).every(key => !COLUMNS_EXCLUDED_FROM_SYNC.includes(key)),
      ).toBe(true);
    }),
  );

  it(
    'returns records changed since given tick only',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;
      await LocalSystemFact.increment('currentSyncTick', 2);
      await ReferenceData.create(fakeReferenceData());

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      const tock = await LocalSystemFact.increment('currentSyncTick', 2);
      await ReferenceData.create(fakeReferenceData());

      const result = await snapshotOutgoingChanges(
        outgoingModels,
        tock - 1,
        [],
        syncSession.id,
        '',
        simplestSessionConfig,
      );
      expect(result).toEqual(1);
    }),
  );

  it(
    'returns records changed since more than one tick',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;
      const firstTock = await LocalSystemFact.increment('currentSyncTick', 2);
      await ReferenceData.create(fakeReferenceData());

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      await LocalSystemFact.increment('currentSyncTick', 2);
      await ReferenceData.create(fakeReferenceData());

      const result = await snapshotOutgoingChanges(
        outgoingModels,
        firstTock - 1,
        [],
        syncSession.id,
        '',
        simplestSessionConfig,
      );
      expect(result).toEqual(2);
    }),
  );

  it(
    'concurrent transaction commits AFTER snapshot commits - SEE NOTE 1',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;

      const queryReturnValue = [undefined, 0];
      let resolveFakeModelQuery;
      const promise = new Promise(resolve => {
        resolveFakeModelQuery = () => resolve(queryReturnValue);
      });
      const fakeModelThatWaitsUntilWeSaySo = {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        getAttributes() {
          return {
            id: {},
            name: {},
          };
        },
        sequelize: {
          async query() {
            return promise;
          },
        },
      };

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      const tock = await LocalSystemFact.increment('currentSyncTick', 2);
      await ReferenceData.create(fakeReferenceData());

      /*
        NOTE 1: the central server snapshotOutgoingChanges function currently
        does not use a transaction. The transaction occurs in the CentralSyncManager
        and inside of it it calls snapshotOutgoingChanges twice.

        Because of that, it's necessary to wrap it here, to make sure the concurrency
        works as expected. However, be mindful that the actual function does not provide
        said isolation.
      */
      const snapshot = ctx.store.sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
        async () => {
          return snapshotOutgoingChanges(
            {
              // the transaction needs to have a select, ANY select, so the database
              // actually takes a snapshot of the db at that point in time. THEN we
              // can pause the transaction, and test the behaviour.
              Facility: models.Facility,
              FakeModel: fakeModelThatWaitsUntilWeSaySo,
              ReferenceData: models.ReferenceData,
            },
            tock - 1,
            [],
            syncSession.id,
            '',
            simplestSessionConfig,
          );
        },
      );

      // wait for snapshot to start and block, and then create a new record
      await sleepAsync(20);
      const after = ctx.store.sequelize.transaction(async transaction => {
        await ReferenceData.create(fakeReferenceData(), {
          transaction,
        });
      });
      await sleepAsync(20);

      // unblock snapshot
      resolveFakeModelQuery();
      const result = await snapshot;

      expect(result).toEqual(1);
      await after;
    }),
  );

  it(
    'concurrent transaction commits BEFORE snapshot commits - SEE NOTE 1',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;

      const queryReturnValue = [undefined, 0];
      let resolveFakeModelQuery;
      const promise = new Promise(resolve => {
        resolveFakeModelQuery = () => resolve(queryReturnValue);
      });
      const fakeModelThatWaitsUntilWeSaySo = {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        getAttributes() {
          return {
            id: {},
            name: {},
          };
        },
        sequelize: {
          async query() {
            return promise;
          },
        },
      };

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      const tock = await LocalSystemFact.increment('currentSyncTick', 2);
      await ReferenceData.create(fakeReferenceData());

      /*
        NOTE 1: the central server snapshotOutgoingChanges function currently
        does not use a transaction. The transaction occurs in the CentralSyncManager
        and inside of it it calls snapshotOutgoingChanges twice.

        Because of that, it's necessary to wrap it here, to make sure the concurrency
        works as expected. However, be mindful that the actual function does not provide
        said isolation.
      */
      const snapshot = ctx.store.sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
        async () => {
          return snapshotOutgoingChanges(
            {
              Facility: models.Facility,
              FakeModel: fakeModelThatWaitsUntilWeSaySo,
              ReferenceData: models.ReferenceData,
            },
            tock - 1,
            [],
            syncSession.id,
            '',
            simplestSessionConfig,
          );
        },
      );

      // wait for snapshot to start and block, and then create a new record
      await sleepAsync(20);
      const after = ctx.store.sequelize.transaction(async transaction => {
        await ReferenceData.create(fakeReferenceData(), {
          transaction,
        });
      });
      await sleepAsync(20);
      await after;

      // unblock snapshot
      resolveFakeModelQuery();
      const result = await snapshot;

      expect(result).toEqual(1);
    }),
  );

  describe('syncAllLabRequests', () => {
    const setupTestData = async () => {
      const {
        Department,
        Encounter,
        Facility,
        LabRequest,
        LabTest,
        LabTestType,
        LocalSystemFact,
        Location,
        Patient,
        ReferenceData,
        SyncSession,
        User,
      } = models;
      const firstTock = await LocalSystemFact.increment('currentSyncTick', 2);
      const user = await User.create(fake(User));
      const patient = await Patient.create(fake(Patient));
      const facility = await Facility.create(fake(Facility));
      const location = await Location.create({ ...fake(Location), facilityId: facility.id });
      const department = await Department.create({ ...fake(Department), facilityId: facility.id });
      const encounter = await Encounter.create({
        ...fake(Encounter),
        examinerId: user.id,
        patientId: patient.id,
        locationId: location.id,
        departmentId: department.id,
      });
      const secondTock = await LocalSystemFact.increment('currentSyncTick', 2);

      const labTestCategory = await ReferenceData.create({
        ...fake(ReferenceData),
        type: 'labTestCategory',
      });
      const labRequest = await LabRequest.create({
        ...fake(LabRequest),
        requestedById: user.id,
        encounterId: encounter.id,
        labTestCategoryId: labTestCategory.id,
      });
      const labTestType = await LabTestType.create({
        ...fake(LabTestType),
        labTestCategoryId: labTestCategory.id,
      });
      const labTest = await LabTest.create({
        ...fake(LabTest),
        labTestTypeId: labTestType.id,
        labRequestId: labRequest.id,
      });

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });

      return { encounter, labTest, labRequest, firstTock, secondTock, syncSession };
    };

    it('includes a lab request for a patient not marked for sync, with its associated test and encounter, if turned on', async () => {
      const { Encounter, LabRequest, LabTest, SyncSessionRecord } = models;
      const { encounter, labTest, labRequest, firstTock, syncSession } = await setupTestData();

      await snapshotOutgoingChanges(
        { Encounter, LabRequest, LabTest },
        firstTock - 1,
        [],
        syncSession.id,
        fakeUUID(),
        { ...simplestSessionConfig, syncAllLabRequests: true },
      );

      const syncSessionRecords = await SyncSessionRecord.findAll({
        where: { sessionId: syncSession.id },
      });
      expect(syncSessionRecords.map(r => r.recordId).sort()).toEqual(
        [labTest.id, labRequest.id, encounter.id].sort(),
      );
    });

    it('includes encounters for new lab requests even if the encounter is older than the sync "since" time', async () => {
      const { Encounter, LabRequest, LabTest, SyncSessionRecord } = models;
      const { encounter, labTest, labRequest, secondTock, syncSession } = await setupTestData();

      await snapshotOutgoingChanges(
        { Encounter, LabRequest, LabTest },
        secondTock - 1,
        [],
        syncSession.id,
        fakeUUID(),
        { ...simplestSessionConfig, syncAllLabRequests: true },
      );

      const syncSessionRecords = await SyncSessionRecord.findAll({
        where: { sessionId: syncSession.id },
      });
      expect(syncSessionRecords.map(r => r.recordId).sort()).toEqual(
        [labTest.id, labRequest.id, encounter.id].sort(),
      );
    });

    it('does not include lab requests for patients not marked for sync if turned off', async () => {
      const { Encounter, LabRequest, LabTest, SyncSessionRecord } = models;
      const { firstTock, syncSession } = await setupTestData();

      await snapshotOutgoingChanges(
        { Encounter, LabRequest, LabTest },
        firstTock - 1,
        [],
        syncSession.id,
        fakeUUID(),
        { ...simplestSessionConfig, syncAllLabRequests: false },
      );

      const syncSessionRecords = await SyncSessionRecord.findAll({
        where: { sessionId: syncSession.id },
      });
      expect(syncSessionRecords.length).toEqual(0);
    });
  });

  describe('syncAllEncountersForTheseVaccines', () => {
    const setupTestData = async () => {
      const {
        AdministeredVaccine,
        Department,
        Encounter,
        Facility,
        LocalSystemFact,
        Location,
        Patient,
        ReferenceData,
        ScheduledVaccine,
        SyncSession,
        User,
      } = models;
      const firstTock = await LocalSystemFact.increment('currentSyncTick', 2);
      const user = await User.create(fake(User));
      const patient = await Patient.create(fake(Patient));
      const facility = await Facility.create(fake(Facility));
      const location = await Location.create({ ...fake(Location), facilityId: facility.id });
      const department = await Department.create({ ...fake(Department), facilityId: facility.id });
      const encounter1 = await Encounter.create({
        ...fake(Encounter),
        examinerId: user.id,
        patientId: patient.id,
        locationId: location.id,
        departmentId: department.id,
      });
      const encounter2 = await Encounter.create({
        ...fake(Encounter),
        examinerId: user.id,
        patientId: patient.id,
        locationId: location.id,
        departmentId: department.id,
      });
      const secondTock = await LocalSystemFact.increment('currentSyncTick', 2);

      const vaccine1 = await ReferenceData.create({ ...fake(ReferenceData), type: 'drug' });
      const vaccine2 = await ReferenceData.create({ ...fake(ReferenceData), type: 'drug' });
      const scheduledVaccine1 = await ScheduledVaccine.create({
        ...fake(ScheduledVaccine),
        vaccineId: vaccine1.id,
      });
      const scheduledVaccine2 = await ScheduledVaccine.create({
        ...fake(ScheduledVaccine),
        vaccineId: vaccine2.id,
      });
      const administeredVaccine1 = await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        scheduledVaccineId: scheduledVaccine1.id,
        encounterId: encounter1.id,
        recorderId: user.id,
      });
      const administeredVaccine2 = await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        scheduledVaccineId: scheduledVaccine2.id,
        encounterId: encounter2.id,
        recorderId: user.id,
      });

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });

      return {
        encounter1,
        encounter2,
        administeredVaccine1,
        administeredVaccine2,
        scheduledVaccine1,
        scheduledVaccine2,
        firstTock,
        secondTock,
        syncSession,
      };
    };

    it('includes required administered vaccines and encounters, if turned on', async () => {
      const { Encounter, AdministeredVaccine, SyncSessionRecord } = models;

      const {
        // use the first vaccine type in the list to sync everywhere, the second should be ignored
        encounter1,
        administeredVaccine1,
        scheduledVaccine1,
        firstTock,
        syncSession,
      } = await setupTestData();

      await snapshotOutgoingChanges(
        { Encounter, AdministeredVaccine },
        firstTock - 1,
        [],
        syncSession.id,
        fakeUUID(),
        {
          ...simplestSessionConfig,
          syncAllEncountersForTheseVaccines: [scheduledVaccine1.vaccineId],
        },
      );

      const syncSessionRecords = await SyncSessionRecord.findAll({
        where: { sessionId: syncSession.id },
      });
      expect(syncSessionRecords.map(r => r.recordId).sort()).toEqual(
        [administeredVaccine1.id, encounter1.id].sort(),
      );
    });

    it('includes encounters for new administered vaccines even if the encounter is older than the sync "since" time', async () => {
      const { Encounter, AdministeredVaccine, SyncSessionRecord } = models;
      const {
        // use the second vaccine this time, to mix things up
        encounter2,
        administeredVaccine2,
        scheduledVaccine2,
        secondTock,
        syncSession,
      } = await setupTestData();

      await snapshotOutgoingChanges(
        { Encounter, AdministeredVaccine },
        secondTock - 1,
        [],
        syncSession.id,
        fakeUUID(),
        {
          ...simplestSessionConfig,
          syncAllEncountersForTheseVaccines: [scheduledVaccine2.vaccineId],
        },
      );

      const syncSessionRecords = await SyncSessionRecord.findAll({
        where: { sessionId: syncSession.id },
      });
      expect(syncSessionRecords.map(r => r.recordId).sort()).toEqual(
        [administeredVaccine2.id, encounter2.id].sort(),
      );
    });

    it('does not include administered vaccines for patients not marked for sync if turned off', async () => {
      const { Encounter, AdministeredVaccine, SyncSessionRecord } = models;

      const { firstTock, syncSession } = await setupTestData();

      await snapshotOutgoingChanges(
        { Encounter, AdministeredVaccine },
        firstTock - 1,
        [],
        syncSession.id,
        fakeUUID(),
        {
          ...simplestSessionConfig,
          syncAllEncountersForTheseVaccines: [],
        },
      );

      const syncSessionRecords = await SyncSessionRecord.findAll({
        where: { sessionId: syncSession.id },
      });
      expect(syncSessionRecords.length).toEqual(0);
    });
  });
});
