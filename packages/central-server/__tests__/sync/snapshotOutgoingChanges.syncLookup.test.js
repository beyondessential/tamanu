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
  let facility;
  let sessionId;
  let tock;

  const simplestSessionConfig = {
    syncAllLabRequests: false,
    isMobile: false,
  };

  const simplestConfig = {
    sync: {
      useLookupTable: true,
      maxRecordsPerSnapshotChunk: 10000000,
    },
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    outgoingModels = getModelsForDirection(models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);
  });

  beforeEach(async () => {
    await models.SyncLookup.truncate({ force: true });
    sessionId = fakeUUID();
    await createSnapshotTable(ctx.store.sequelize, sessionId);
    tock = await models.LocalSystemFact.increment('currentSyncTick', 2);
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
      facility.id,
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

  it("returns records with updated_at_sync_tick higher than 'since'", async () => {
    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      facility.id,
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
      facility.id,
      tock - 1,
    );

    await models.SyncLookup.bulkCreate([
      fake(models.SyncLookup, {
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
      facility.id,
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

  it('does not return records that are linked to a different facility than the current facility', async () => {
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
        facilityId: 'some other facility',
        encounterId: null,
        isLabRequest: false,
        data: { test: 'test' },
        updatedAtByFieldSum: 1,
        updatedAtSyncTick: 10,
      }),
      fake(models.SyncLookup, {
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
      facility.id,
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
        patientId: 'some other patients', // should not return
        facilityId: null,
        encounterId: null,
        isLabRequest: false,
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
        facilityId: 'some other facility', // should not return
        encounterId: null,
        isLabRequest: false,
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

    expect(result).toEqual(4);
  })
});
