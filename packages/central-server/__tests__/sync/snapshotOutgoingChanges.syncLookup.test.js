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
