import { beforeAll, describe, expect, it } from '@jest/globals';
import { Transaction } from 'sequelize';

import { withErrorShown } from '@tamanu/shared/test-helpers';
import { fake, fakeReferenceData } from '@tamanu/fake-data/fake';

import {
  COLUMNS_EXCLUDED_FROM_SYNC,
  createSnapshotTable,
  findSyncSnapshotRecordsOrderByDependency,
  getModelsForPull,
  SYNC_SESSION_DIRECTION,
} from '@tamanu/database/sync';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { fakeUUID } from '@tamanu/utils/generateId';

import { createTestContext } from '../utilities';
import { snapshotOutgoingChanges } from '../../dist/sync/snapshotOutgoingChanges';
import { createMarkedForSyncPatientsTable } from '../../dist/sync/createMarkedForSyncPatientsTable';

describe('snapshotOutgoingChanges', () => {
  let ctx;
  let models;
  let outgoingModels;
  const simplestSessionConfig = {
    syncAllLabRequests: false,
    isMobile: false,
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    outgoingModels = getModelsForPull(models);
  });

  afterAll(() => ctx.close());

  it(
    'if nothing changed returns 0',
    withErrorShown(async () => {
      const { LocalSystemFact } = models;
      const tock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);

      const sessionId = fakeUUID();
      await createSnapshotTable(ctx.store.sequelize, sessionId);

      const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
        ctx.store.sequelize,
        sessionId,
        true,
        [''],
        tock - 1,
      );

      const result = await snapshotOutgoingChanges(
        ctx.store,
        outgoingModels,
        tock - 1,
        0,
        fullSyncPatientsTable,
        sessionId,
        [''],
        null,
        simplestSessionConfig,
      );
      expect(result).toEqual(0);
    }),
  );

  it(
    'returns serialised records (excluding metadata columns)',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;
      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      const tock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
      await ReferenceData.create(fakeReferenceData());

      await createSnapshotTable(ctx.store.sequelize, syncSession.id);

      const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
        ctx.store.sequelize,
        syncSession.id,
        true,
        [''],
        tock - 1,
      );

      const result = await snapshotOutgoingChanges(
        ctx.store,
        outgoingModels,
        tock - 1,
        0,
        fullSyncPatientsTable,
        syncSession.id,
        [''],
        null,
        simplestSessionConfig,
      );
      expect(result).toEqual(1);

      const [syncRecord] = await findSyncSnapshotRecordsOrderByDependency(
        ctx.store,
        syncSession.id,
        SYNC_SESSION_DIRECTION.OUTGOING,
      );
      expect(
        Object.keys(syncRecord.data).every((key) => !COLUMNS_EXCLUDED_FROM_SYNC.includes(key)),
      ).toBe(true);
    }),
  );

  it(
    'returns records changed since given tick only',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;
      await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
      await ReferenceData.create(fakeReferenceData());

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      await createSnapshotTable(ctx.store.sequelize, syncSession.id);

      const tock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
      await ReferenceData.create(fakeReferenceData());

      const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
        ctx.store.sequelize,
        syncSession.id,
        true,
        [''],
        tock - 1,
      );

      const result = await snapshotOutgoingChanges(
        ctx.store,
        outgoingModels,
        tock - 1,
        0,
        fullSyncPatientsTable,
        syncSession.id,
        [''],
        null,
        simplestSessionConfig,
      );
      expect(result).toEqual(1);
    }),
  );

  it(
    'returns records changed since more than one tick',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;
      const firstTock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
      await ReferenceData.create(fakeReferenceData());

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      await createSnapshotTable(ctx.store.sequelize, syncSession.id);
      await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
      await ReferenceData.create(fakeReferenceData());

      // for regular sync patients
      const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
        ctx.store.sequelize,
        syncSession.id,
        true,
        [''],
        firstTock - 1,
      );

      const result = await snapshotOutgoingChanges(
        ctx.store,
        outgoingModels,
        firstTock - 1,
        0,
        fullSyncPatientsTable,
        syncSession.id,
        [''],
        null,
        simplestSessionConfig,
      );
      expect(result).toEqual(2);
    }),
  );

  it(
    'concurrent transaction commits AFTER snapshot commits - SEE NOTE 1',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;

      const queryReturnValue = [[{ maxId: null, count: 0 }]];
      let resolveFakeModelQuery;
      const promise = new Promise((resolve) => {
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
        buildSyncFilter: () => null,
      };

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      await createSnapshotTable(ctx.store.sequelize, syncSession.id);
      const tock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
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
            ctx.store,
            {
              // the transaction needs to have a select, ANY select, so the database
              // actually takes a snapshot of the db at that point in time. THEN we
              // can pause the transaction, and test the behaviour.
              Facility: models.Facility,
              FakeModel: fakeModelThatWaitsUntilWeSaySo,
              ReferenceData: models.ReferenceData,
            },
            tock - 1,
            0,
            true,
            syncSession.id,
            [''],
            null,
            simplestSessionConfig,
          );
        },
      );

      // wait for snapshot to start and block, and then create a new record
      await sleepAsync(20);
      const after = ctx.store.sequelize.transaction(async (transaction) => {
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

      const queryReturnValue = [[{ maxId: null, count: 0 }]];
      let resolveFakeModelQuery;
      const promise = new Promise((resolve) => {
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
        buildSyncFilter: () => null,
      };

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      await createSnapshotTable(ctx.store.sequelize, syncSession.id);
      const tock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
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
            ctx.store,
            {
              Facility: models.Facility,
              FakeModel: fakeModelThatWaitsUntilWeSaySo,
              ReferenceData: models.ReferenceData,
            },
            tock - 1,
            0,
            true,
            syncSession.id,
            [''],
            null,
            simplestSessionConfig,
          );
        },
      );

      // wait for snapshot to start and block, and then create a new record
      await sleepAsync(20);
      const after = ctx.store.sequelize.transaction(async (transaction) => {
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
        PatientFacility,
        ReferenceData,
        SyncSession,
        User,
      } = models;
      const firstTock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
      const user = await User.create(fake(User));
      const patient1 = await Patient.create(fake(Patient));
      const patient2 = await Patient.create(fake(Patient));
      const facility = await Facility.create(fake(Facility));
      const facility2 = await Facility.create(fake(Facility));
      const location = await Location.create({ ...fake(Location), facilityId: facility2.id });
      const department = await Department.create({ ...fake(Department), facilityId: facility2.id });
      const encounter1 = await Encounter.create({
        ...fake(Encounter),
        examinerId: user.id,
        patientId: patient1.id,
        locationId: location.id,
        departmentId: department.id,
      });
      const encounter2 = await Encounter.create({
        ...fake(Encounter),
        examinerId: user.id,
        patientId: patient2.id,
        locationId: location.id,
        departmentId: department.id,
      });

      await PatientFacility.create({ patientId: patient2.id, facilityId: facility.id });

      const secondTock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);

      const labTestCategory = await ReferenceData.create({
        ...fake(ReferenceData),
        type: 'labTestCategory',
      });
      const labRequest1 = await LabRequest.create({
        ...fake(LabRequest),
        requestedById: user.id,
        encounterId: encounter1.id,
        labTestCategoryId: labTestCategory.id,
      });
      const labRequest2 = await LabRequest.create({
        ...fake(LabRequest),
        requestedById: user.id,
        encounterId: encounter2.id,
        labTestCategoryId: labTestCategory.id,
      });
      const labTestType = await LabTestType.create({
        ...fake(LabTestType),
        labTestCategoryId: labTestCategory.id,
      });
      const labTest1 = await LabTest.create({
        ...fake(LabTest),
        labTestTypeId: labTestType.id,
        labRequestId: labRequest1.id,
      });
      const labTest2 = await LabTest.create({
        ...fake(LabTest),
        labTestTypeId: labTestType.id,
        labRequestId: labRequest2.id,
      });

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      await createSnapshotTable(ctx.store.sequelize, syncSession.id);

      return {
        encounter1,
        encounter2,
        labTest1,
        labTest2,
        labRequest1,
        labRequest2,
        patient1,
        patient2,
        firstTock,
        secondTock,
        syncSession,
        facility,
      };
    };

    it('includes a lab request for a patient not marked for sync, with its associated test and encounter, if turned on', async () => {
      const { Encounter, LabRequest, LabTest } = models;
      const {
        encounter1,
        encounter2,
        labTest1,
        labTest2,
        labRequest1,
        labRequest2,
        firstTock,
        syncSession,
      } = await setupTestData();

      const facilityId = fakeUUID();

      // for regular sync patients
      const incrementalSyncPatientsTable = await createMarkedForSyncPatientsTable(
        ctx.store.sequelize,
        syncSession.id,
        true,
        [facilityId],
        firstTock - 1,
      );

      await snapshotOutgoingChanges(
        ctx.store,
        { Encounter, LabRequest, LabTest },
        firstTock - 1,
        1,
        incrementalSyncPatientsTable,
        syncSession.id,
        [facilityId],
        null,
        { ...simplestSessionConfig, syncAllLabRequests: true },
      );

      const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
        ctx.store,
        syncSession.id,
        SYNC_SESSION_DIRECTION.OUTGOING,
      );
      expect(outgoingSnapshotRecords.map((r) => r.recordId).sort()).toEqual(
        [
          labTest1.id,
          labTest2.id,
          labRequest1.id,
          labRequest2.id,
          encounter1.id,
          encounter2.id,
        ].sort(),
      );
    });

    it('includes encounters for patients not marked for sync even if the encounter is older than the sync "since" time', async () => {
      const { Encounter, LabRequest, LabTest } = models;
      const {
        encounter1,
        labTest1,
        labTest2,
        labRequest1,
        labRequest2,
        secondTock,
        syncSession,
        facility,
      } = await setupTestData();

      const incrementalSyncPatientsTable = await createMarkedForSyncPatientsTable(
        ctx.store.sequelize,
        syncSession.id,
        false,
        [facility.id],
        secondTock - 1,
      );

      await snapshotOutgoingChanges(
        ctx.store,
        { Encounter, LabRequest, LabTest },
        secondTock - 1,
        1,
        incrementalSyncPatientsTable,
        syncSession.id,
        [facility.id],
        null,
        { ...simplestSessionConfig, syncAllLabRequests: true },
      );

      const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
        ctx.store,
        syncSession.id,
        SYNC_SESSION_DIRECTION.OUTGOING,
      );
      expect(outgoingSnapshotRecords.map((r) => r.recordId).sort()).toEqual(
        [
          labTest1.id,
          labTest2.id,
          labRequest1.id,
          labRequest2.id,
          // n.b. only expect encounter1 here, as encounter2 is for a marked-for-sync patient,
          // and older than the sync tick so is not synced here
          encounter1.id,
        ].sort(),
      );
    });

    it('does not include lab requests for patients not marked for sync if turned off', async () => {
      const { Encounter, LabRequest, LabTest } = models;
      const { firstTock, syncSession } = await setupTestData();

      await snapshotOutgoingChanges(
        ctx.store,
        { Encounter, LabRequest, LabTest },
        firstTock - 1,
        0,
        true,
        syncSession.id,
        fakeUUID(),
        null,
        { ...simplestSessionConfig, syncAllLabRequests: false },
      );

      const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
        ctx.store,
        syncSession.id,
        SYNC_SESSION_DIRECTION.OUTGOING,
      );
      expect(outgoingSnapshotRecords.length).toEqual(0);
    });
  });
});
