import { beforeAll, describe } from '@jest/globals';

import {
  getModelsForPull,
  createSnapshotTable,
  findSyncSnapshotRecordsOrderByDependency,
  SYNC_SESSION_DIRECTION,
} from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { fakeUUID } from '@tamanu/utils/generateId';
import { createDummyPatient } from '@tamanu/database/demoData/patients';

import { createTestContext } from '../utilities';
import { createMarkedForSyncPatientsTable } from '../../dist/sync/createMarkedForSyncPatientsTable';
import { snapshotOutgoingChanges } from '../../dist/sync/snapshotOutgoingChanges';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';

describe('snapshotOutgoingChanges', () => {
  let ctx;
  let models;
  let outgoingModels;
  let facility;
  let sessionId;
  let tock;

  const simplestSessionConfig = {
    syncAllLabRequests: false,
    isMobile: false,
  };

  const simplestConfig = {
    sync: {
      lookupTable: {
        enabled: true,
      },
      maxRecordsPerSnapshotChunk: 10000000,
    },
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    outgoingModels = getModelsForPull(models);
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.SyncLookup.truncate({ force: true });
    sessionId = fakeUUID();
    const startTime = new Date();
    await models.SyncSession.create({
      id: sessionId,
      startTime,
      lastConnectionTime: startTime,
      debugInfo: {},
    });
    await createSnapshotTable(ctx.store.sequelize, sessionId);
    tock = await models.LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
    facility = await models.Facility.create({
      code: 'test-facility-1',
      name: 'Test Facility 1',
    });
  });

  it("return all records when 'since' is -1", async () => {
    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      tock - 1,
    );

    const refData1Id = fakeUUID();
    const refData2Id = fakeUUID();

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        id: 1,
        recordId: refData1Id,
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
        id: 2,
        recordId: refData2Id,
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

    await snapshotOutgoingChanges(
      ctx.store,
      outgoingModels,
      -1,
      0,
      fullSyncPatientsTable,
      sessionId,
      [''],
      null,
      simplestSessionConfig,
      simplestConfig,
    );

    const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      ctx.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );
    expect(outgoingSnapshotRecords.map((r) => r.recordId).sort()).toEqual(
      [refData1Id, refData2Id].sort(),
    );
  });

  it("returns records with updated_at_sync_tick higher than 'since'", async () => {
    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      tock - 1,
    );

    const refData1Id = fakeUUID();
    const refData2Id = fakeUUID();

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        id: 1,
        recordId: refData1Id,
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
        id: 2,
        recordId: refData2Id,
        recordType: 'reference_data',
        patientId: null,
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 1, // should not be returned as updatedAtSyncTick is only 1 < 8
      }),
    ]);

    const SINCE = 8;

    await snapshotOutgoingChanges(
      ctx.store,
      outgoingModels,
      SINCE,
      0,
      fullSyncPatientsTable,
      sessionId,
      [''],
      null,
      simplestSessionConfig,
      simplestConfig,
    );

    const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      ctx.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );
    expect(outgoingSnapshotRecords.length).toEqual(1);
    expect(outgoingSnapshotRecords[0].recordId).toEqual(refData1Id);
  });

  it('returns records that linked to marked for sync patients', async () => {
    const patientData = createDummyPatient(models);
    const patient = await models.Patient.create(patientData);
    await models.PatientFacility.create({
      patientId: patient.id,
      facilityId: facility.id,
    });

    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      tock - 1,
    );

    const imagingRequest1Id = fakeUUID();
    const imagingRequest2Id = fakeUUID();

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        id: 1,
        recordId: imagingRequest1Id,
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
        id: 2,
        recordId: imagingRequest2Id,
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

    await snapshotOutgoingChanges(
      ctx.store,
      { ImagingRequest: models.ImagingRequest },
      9,
      1,
      fullSyncPatientsTable,
      sessionId,
      [facility.id],
      null,
      simplestSessionConfig,
      simplestConfig,
    );

    const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      ctx.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );
    expect(outgoingSnapshotRecords.map((r) => r.recordId).sort()).toEqual(
      [imagingRequest1Id, imagingRequest2Id].sort(),
    );
  });

  it('does not return records that are linked to other patients that are not marked for sync patients of the current facility', async () => {
    const patientData = createDummyPatient(models);
    const patient = await models.Patient.create(patientData);
    await models.PatientFacility.create({
      patientId: patient.id,
      facilityId: facility.id,
    });

    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      tock - 1,
    );

    const imagingRequest1Id = fakeUUID();
    const imagingRequest2Id = fakeUUID();

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        id: 1,
        recordId: imagingRequest1Id,
        recordType: 'imaging_requests',
        patientId: 'some other patients',
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
      fake(models.SyncLookup, {
        id: 2,
        recordId: imagingRequest2Id,
        recordType: 'imaging_requests',
        patientId: 'some other patients',
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
      [facility.id],
      null,
      simplestSessionConfig,
      simplestConfig,
    );

    expect(result).toEqual(0);
  });

  it('returns records that linked to current facility', async () => {
    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      tock - 1,
    );

    const settings1Id = fakeUUID();
    const settings2Id = fakeUUID();

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        id: 1,
        recordId: settings1Id,
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
        id: 2,
        recordId: settings2Id,
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

    await snapshotOutgoingChanges(
      ctx.store,
      { Setting: models.Setting },
      9,
      1,
      fullSyncPatientsTable,
      sessionId,
      [facility.id],
      null,
      simplestSessionConfig,
      simplestConfig,
    );

    const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      ctx.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );
    expect(outgoingSnapshotRecords.map((r) => r.recordId).sort()).toEqual(
      [settings1Id, settings2Id].sort(),
    );
  });

  it('does not return records that are linked to a different facility than the current facility', async () => {
    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      tock - 1,
    );

    const settings1Id = fakeUUID();
    const settings2Id = fakeUUID();

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        id: 1,
        recordId: settings1Id,
        recordType: 'settings',
        patientId: null,
        facilityId: 'some other facility',
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
      fake(models.SyncLookup, {
        id: 2,
        recordId: settings2Id,
        recordType: 'settings',
        patientId: null,
        facilityId: 'some other facility',
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
      [facility.id],
      null,
      simplestSessionConfig,
      simplestConfig,
    );

    expect(result).toEqual(0);
  });

  it('returns all lab request data when syncAllLabRequests is enabled', async () => {
    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      tock - 1,
    );

    const labRecord1Id = fakeUUID();
    const labRecord2Id = fakeUUID();

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        id: 1,
        recordId: labRecord1Id,
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
        id: 2,
        recordId: labRecord2Id,
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
      [facility.id],
      null,
      {
        syncAllLabRequests: true,
        isMobile: false,
      },
      simplestConfig,
    );

    const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      ctx.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );
    expect(outgoingSnapshotRecords.map((r) => r.recordId).sort()).toEqual(
      [labRecord1Id, labRecord2Id].sort(),
    );

    expect(result).toEqual(2);
  });

  it('returns combination of different models', async () => {
    const patientData = createDummyPatient(models);
    const patient = await models.Patient.create(patientData);
    await models.PatientFacility.create({
      patientId: patient.id,
      facilityId: facility.id,
    });

    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      tock - 1,
    );

    const imagingRequest1Id = fakeUUID();
    const imagingRequest2Id = fakeUUID();
    const labRequest1Id = fakeUUID();
    const labRequest2Id = fakeUUID();
    const settings1Id = fakeUUID();
    const settings2Id = fakeUUID();

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        id: 1,
        recordId: imagingRequest1Id,
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
        id: 2,
        recordId: imagingRequest2Id,
        recordType: 'imaging_requests',
        patientId: 'some other patients', // should not return
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
      fake(models.SyncLookup, {
        id: 3,
        recordId: labRequest1Id,
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
        id: 4,
        recordId: labRequest2Id,
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
        id: 5,
        recordId: settings1Id,
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
        id: 6,
        recordId: settings2Id,
        recordType: 'settings',
        patientId: null,
        facilityId: 'some other facility', // should not return
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
    ]);

    await snapshotOutgoingChanges(
      ctx.store,
      {
        LabRequest: models.LabRequest,
        ImagingRequest: models.ImagingRequest,
        Setting: models.Setting,
      },
      9,
      1,
      fullSyncPatientsTable,
      sessionId,
      [facility.id],
      null,
      {
        syncAllLabRequests: true,
        isMobile: false,
      },
      simplestConfig,
    );

    const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      ctx.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );
    expect(outgoingSnapshotRecords.map((r) => r.recordId).sort()).toEqual(
      [imagingRequest1Id, labRequest1Id, labRequest2Id, settings1Id].sort(),
    );
  });

  it('returns only the records of the specified model type', async () => {
    const patientData = createDummyPatient(models);
    const patient = await models.Patient.create(patientData);
    await models.PatientFacility.create({
      patientId: patient.id,
      facilityId: facility.id,
    });

    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      tock - 1,
    );

    const imagingRequest1Id = fakeUUID();
    const imagingRequest2Id = fakeUUID();
    const labRequest1Id = fakeUUID();
    const labRequest2Id = fakeUUID();
    const settings1Id = fakeUUID();
    const settings2Id = fakeUUID();

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
        id: 1,
        recordId: imagingRequest1Id,
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
        id: 2,
        recordId: imagingRequest2Id,
        recordType: 'imaging_requests',
        patientId: 'some other patients', // should not return
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
      fake(models.SyncLookup, {
        id: 3,
        recordId: labRequest1Id,
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
        id: 4,
        recordId: labRequest2Id,
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
        id: 5,
        recordId: settings1Id,
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
        id: 6,
        recordId: settings2Id,
        recordType: 'settings',
        patientId: null,
        facilityId: 'some other facility', // should not return
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
    ]);

    await snapshotOutgoingChanges(
      ctx.store,
      {
        ImagingRequest: models.ImagingRequest,
        Setting: models.Setting,
        // No LabRequest here
      },
      1,
      1,
      fullSyncPatientsTable,
      sessionId,
      [facility.id],
      null,
      {
        syncAllLabRequests: true,
        isMobile: false,
      },
      simplestConfig,
    );

    const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      ctx.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );
    expect(outgoingSnapshotRecords.map((r) => r.recordId).sort()).toEqual(
      [imagingRequest1Id, settings1Id].sort(),
    );
  });
});
