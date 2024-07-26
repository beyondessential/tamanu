import { beforeAll, describe } from '@jest/globals';

import { getModelsForDirection, createSnapshotTable } from '@tamanu/shared/sync';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { fake } from '@tamanu/shared/test-helpers';
import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { createDummyPatient } from '@tamanu/shared/demoData/patients';

import { createTestContext } from '../utilities';
import { createMarkedForSyncPatientsTable } from '../../dist/sync/createMarkedForSyncPatientsTable';
import { snapshotOutgoingChanges } from '../../dist/sync/snapshotOutgoingChanges';

describe('snapshotOutgoingChanges', () => {
  let ctx;
  let models;
  let outgoingModels;
  const simplestSessionConfig = {
    syncAllLabRequests: false,
    isMobile: false,
  };

  const simplestConfig = {
    sync: {
      lookupTable: true,
      maxRecordsPerPullSnapshotChunk: 10000000,
    },
  };

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
    const firstTock = await LocalSystemFact.increment('currentSyncTick', 2);
    const user = await User.create(fake(User));
    const patient1 = await Patient.create(fake(Patient));
    const patient2 = await Patient.create(fake(Patient));
    const facility = await Facility.create(fake(Facility));
    const location = await Location.create({ ...fake(Location), facilityId: facility.id });
    const department = await Department.create({ ...fake(Department), facilityId: facility.id });
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

    const secondTock = await LocalSystemFact.increment('currentSyncTick', 2);

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

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    outgoingModels = getModelsForDirection(models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);
  });

  beforeEach(async () => {
    await models.SyncLookup.truncate({ force: true });
  });

  it("return all records when 'since' is -1", async () => {
    const sessionId = fakeUUID();
    await createSnapshotTable(ctx.store.sequelize, sessionId);
    const tock = await models.LocalSystemFact.increment('currentSyncTick', 2);

    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      '',
      tock - 1,
    );

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        recordType: 'reference_data',
        patientId: null,
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 1,
      }),
      fake(models.SyncLookup, {
        recordType: 'reference_data',
        patientId: null,
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 1,
      }),
    ]);

    const result = await snapshotOutgoingChanges(
      ctx.store,
      outgoingModels,
      -1,
      0,
      fullSyncPatientsTable,
      sessionId,
      '',
      simplestSessionConfig,
      simplestConfig,
    );

    expect(result).toEqual(2);
  });

  it("return records with updated_at_sync_tick higher than 'since'", async () => {
    const sessionId = fakeUUID();
    await createSnapshotTable(ctx.store.sequelize, sessionId);
    const tock = await models.LocalSystemFact.increment('currentSyncTick', 2);

    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      '',
      tock - 1,
    );

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        recordType: 'reference_data',
        patientId: null,
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
      fake(models.SyncLookup, {
        recordType: 'reference_data',
        patientId: null,
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 1,
      }),
    ]);

    const result = await snapshotOutgoingChanges(
      ctx.store,
      outgoingModels,
      8,
      0,
      fullSyncPatientsTable,
      sessionId,
      '',
      simplestSessionConfig,
      simplestConfig,
    );

    expect(result).toEqual(1);
  });

  it('return records that linked to patients', async () => {
    const sessionId = fakeUUID();
    await createSnapshotTable(ctx.store.sequelize, sessionId);
    const tock = await models.LocalSystemFact.increment('currentSyncTick', 2);

    const patientData = createDummyPatient(models);
    const patient = await models.Patient.create(patientData);
    const facility = await models.Facility.create({
      code: 'test-facility-1',
      name: 'Test Facility 1',
    });
    await models.PatientFacility.create({
      patientId: patient.id,
      facilityId: facility.id,
    });

    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      facility.id,
      tock - 1,
    );

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        recordType: 'imaging_requests',
        patientId: patient.id,
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
      fake(models.SyncLookup, {
        recordType: 'imaging_requests',
        patientId: patient.id,
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
    ]);

    const result = await snapshotOutgoingChanges(
      ctx.store,
      { ImagingRequest: models.ImagingRequest },
      9,
      1,
      fullSyncPatientsTable,
      sessionId,
      facility.id,
      simplestSessionConfig,
      simplestConfig,
    );

    expect(result).toEqual(2);
  });

  it('return records that linked to facilities', async () => {
    const sessionId = fakeUUID();
    await createSnapshotTable(ctx.store.sequelize, sessionId);
    const tock = await models.LocalSystemFact.increment('currentSyncTick', 2);

    const facility = await models.Facility.create({
      code: 'test-facility-1',
      name: 'Test Facility 1',
    });

    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      facility.id,
      tock - 1,
    );

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        recordType: 'settings',
        patientId: null,
        facilityId: facility.id,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
      fake(models.SyncLookup, {
        recordType: 'settings',
        patientId: null,
        facilityId: facility.id,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
    ]);

    const result = await snapshotOutgoingChanges(
      ctx.store,
      { ImagingRequest: models.ImagingRequest },
      9,
      1,
      fullSyncPatientsTable,
      sessionId,
      facility.id,
      simplestSessionConfig,
      simplestConfig,
    );

    expect(result).toEqual(2);
  });

  it('return all lab request data when syncAllLabRequests is enabled', async () => {
    const sessionId = fakeUUID();

    await createSnapshotTable(ctx.store.sequelize, sessionId);
    const tock = await models.LocalSystemFact.increment('currentSyncTick', 2);

    const facility = await models.Facility.create({
      code: 'test-facility-1',
      name: 'Test Facility 1',
    });

    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      facility.id,
      tock - 1,
    );

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        recordType: 'lab_requests',
        patientId: null,
        facilityId: null,
        encounterId: null,
        isLabRequest: true,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
      fake(models.SyncLookup, {
        recordType: 'lab_requests',
        patientId: null,
        facilityId: null,
        encounterId: null,
        isLabRequest: true,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
    ]);

    const result = await snapshotOutgoingChanges(
      ctx.store,
      { LabRequest: models.LabRequest },
      9,
      1,
      fullSyncPatientsTable,
      sessionId,
      facility.id,
      {
        syncAllLabRequests: true,
        isMobile: false,
      },
      simplestConfig,
    );

    expect(result).toEqual(2);
  });
});
