import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import {
  createSnapshotTable,
  dropSnapshotTable,
  findSyncSnapshotRecords,
  getModelsForPull,
  SYNC_SESSION_DIRECTION,
} from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { fakeUUID } from '@tamanu/utils/generateId';

import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { isHashReferencedInScope } from '../../app/blobReferences';
import { createMarkedForSyncPatientsTable } from '../../app/sync/createMarkedForSyncPatientsTable';
import { snapshotOutgoingChanges } from '../../app/sync/snapshotOutgoingChanges';
import { createTestContext } from '../utilities';

// spec: BLAC
// `isHashReferencedInScope` reproduces the pull filter's predicate by hand; drift would widen blob
// access past record sync.
describe('Blob scope agrees with the record sync pull filter', () => {
  let ctx;
  let models;
  let sequelize;
  let outgoingModels;
  let facilityA;
  let facilityB;
  let sensitiveFacility;
  let attachments;

  const lookupEnabledConfig = {
    sync: {
      lookupTable: {
        enabled: true,
      },
      maxRecordsPerSnapshotChunk: 10000000,
    },
  };

  const sessionConfig = { syncAllLabRequests: false, isMobile: false };

  const markedForSyncPatient = async (facility, patient) =>
    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: patient.id,
      facilityId: facility.id,
    });

  const encounterAt = async (facility, patient) => {
    const department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    const location = await models.Location.create(
      fake(models.Location, { facilityId: facility.id }),
    );
    const examiner = await models.User.create(fake(models.User));
    return await models.Encounter.create(
      fake(models.Encounter, {
        patientId: patient.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: examiner.id,
        endDate: null,
      }),
    );
  };

  let hashSeq = 0;
  const attachmentCarryingHash = async (label, overrides) => {
    const hash = `sha256:${String(hashSeq++).padStart(2, '0').repeat(32)}`;
    await models.Attachment.create(
      fake(models.Attachment, { ...overrides, type: 'text/plain', size: 1, hash, data: null }),
    );
    return { label, hash };
  };

  // Taken from the records the snapshot holds rather than a re-derived predicate.
  const syncPullAdmits = async facilityIds => {
    const sessionId = fakeUUID();
    const startTime = new Date();
    await models.SyncSession.create({
      id: sessionId,
      startTime,
      lastConnectionTime: startTime,
      debugInfo: {},
    });
    await createSnapshotTable(sequelize, sessionId);
    try {
      const markedForSyncPatients = await createMarkedForSyncPatientsTable(
        sequelize,
        sessionId,
        true,
        facilityIds,
        -1,
      );
      const patientCount = await models.PatientFacility.count({
        where: { facilityId: facilityIds },
      });
      await snapshotOutgoingChanges(
        ctx.store,
        outgoingModels,
        -1,
        patientCount,
        markedForSyncPatients,
        sessionId,
        facilityIds,
        null,
        sessionConfig,
        lookupEnabledConfig,
      );
      const snapshotted = await findSyncSnapshotRecords(
        ctx.store,
        sessionId,
        SYNC_SESSION_DIRECTION.OUTGOING,
        0,
        Number.MAX_SAFE_INTEGER,
        'attachments',
      );
      const admittedIds = new Set(snapshotted.map(record => record.recordId));
      const rows = await models.Attachment.findAll({
        where: { id: [...admittedIds] },
      });
      return rows.map(row => row.hash).sort();
    } finally {
      await dropSnapshotTable(sequelize, sessionId);
    }
  };

  const blobScopeAdmits = async facilityIds => {
    const admitted = [];
    for (const { hash } of attachments) {
      if (await isHashReferencedInScope(sequelize, { hash, facilityIds })) {
        admitted.push(hash);
      }
    }
    return admitted.sort();
  };

  const labelsOf = hashes =>
    hashes.map(hash => attachments.find(a => a.hash === hash)?.label ?? hash).sort();

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
    outgoingModels = getModelsForPull(models);

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);

    facilityA = await models.Facility.create(fake(models.Facility));
    facilityB = await models.Facility.create(fake(models.Facility));
    sensitiveFacility = await models.Facility.create(fake(models.Facility, { isSensitive: true }));

    const patientAtA = await models.Patient.create(fake(models.Patient));
    const patientAtB = await models.Patient.create(fake(models.Patient));
    const patientAtBoth = await models.Patient.create(fake(models.Patient));
    const patientMarkedNowhere = await models.Patient.create(fake(models.Patient));
    await markedForSyncPatient(facilityA, patientAtA);
    await markedForSyncPatient(facilityB, patientAtB);
    await markedForSyncPatient(facilityA, patientAtBoth);
    await markedForSyncPatient(facilityB, patientAtBoth);
    await markedForSyncPatient(sensitiveFacility, patientAtA);

    const sensitiveEncounter = await encounterAt(sensitiveFacility, patientAtA);
    const ordinaryEncounter = await encounterAt(facilityA, patientAtA);

    attachments = [
      await attachmentCarryingHash('patient at A', { patientId: patientAtA.id }),
      await attachmentCarryingHash('patient at B', { patientId: patientAtB.id }),
      await attachmentCarryingHash('patient at both', { patientId: patientAtBoth.id }),
      await attachmentCarryingHash('patient marked nowhere', {
        patientId: patientMarkedNowhere.id,
      }),
      await attachmentCarryingHash('sensitive encounter', {
        encounterId: sensitiveEncounter.id,
      }),
      await attachmentCarryingHash('ordinary encounter', { encounterId: ordinaryEncounter.id }),
      await attachmentCarryingHash('no patient or encounter', {}),
    ];

    await new CentralSyncManager(ctx).updateLookupTable();
  });

  afterAll(() => ctx.close());

  it.each([
    ['a single facility', () => [facilityA.id]],
    ['a facility sharing only some of its patients', () => [facilityB.id]],
    ['a sensitive facility', () => [sensitiveFacility.id]],
    ['a server running several facilities', () => [facilityA.id, facilityB.id]],
    ['a scope including a sensitive facility', () => [facilityA.id, sensitiveFacility.id]],
  ])('admits the same records as a pull for %s', async (_name, facilityIds) => {
    const scope = facilityIds();
    expect(labelsOf(await blobScopeAdmits(scope))).toEqual(labelsOf(await syncPullAdmits(scope)));
  });

  // Only meaningful if the fixture discriminates: with every record in scope everywhere, the
  // predicates could differ and still agree.
  it('spans records the scope both admits and refuses', async () => {
    for (const admitted of [
      await blobScopeAdmits([facilityA.id]),
      await syncPullAdmits([facilityA.id]),
    ]) {
      expect(admitted.length).toBeGreaterThan(0);
      expect(admitted.length).toBeLessThan(attachments.length);
      expect(labelsOf(admitted)).not.toContain('sensitive encounter');
    }
    expect(labelsOf(await blobScopeAdmits([sensitiveFacility.id]))).toContain(
      'sensitive encounter',
    );
  });
});
