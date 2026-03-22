import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

describe('CentralSyncManager.addIncomingChanges syncDirection validation', () => {
  let ctx;
  let models;

  const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;
  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  beforeEach(async () => {
    jest.resetModules();
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.Program.truncate({ cascade: true, force: true });
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

  it('rejects incoming changes with invalid syncDirection', async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '18');
    const facility = await models.Facility.create(fake(models.Facility));

    // Facility has PULL_FROM_CENTRAL syncDirection, which should not be allowed for push
    const facilityData = fake(models.Facility);
    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'facilities',
        recordId: facilityData.id,
        data: facilityData,
      },
    ];

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });
    await centralSyncManager.updateLookupTable();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 1,
        facilityIds: [facility.id],
      },
      () => true,
    );

    // Should throw an error
    await expect(centralSyncManager.addIncomingChanges(sessionId, changes)).rejects.toThrow(
      'Sync security violation',
    );

    // Session should be marked as errored
    const session = await models.SyncSession.findByPk(sessionId);
    expect(session.errors).toHaveLength(1);
    expect(session.errors[0]).toContain('Sync security violation');

    // Debug info should contain rejected record
    expect(session.debugInfo).toHaveProperty('rejectedRecord');
    expect(session.debugInfo.rejectedRecord).toEqual({
      type: 'facilities',
      id: facilityData.id,
    });
  });

  it('allows incoming changes with valid syncDirection', async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '19');
    const facility = await models.Facility.create(fake(models.Facility));
    const patient = await models.Patient.create(fake(models.Patient));
    const program = await models.Program.create(fake(models.Program));
    const clinician = await models.User.create(fakeUser());

    const programRegistry = await models.ProgramRegistry.create({
      ...fake(models.ProgramRegistry),
      programId: program.id,
    });

    // PatientProgramRegistration has BIDIRECTIONAL syncDirection, which is allowed
    const patientProgramRegistrationData = fake(models.PatientProgramRegistration, {
      programRegistryId: programRegistry.id,
      clinicianId: clinician.id,
      patientId: patient.id,
      facilityId: facility.id,
    });
    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'patient_program_registrations',
        recordId: patientProgramRegistrationData.id,
        data: patientProgramRegistrationData,
      },
    ];

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });
    await centralSyncManager.updateLookupTable();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 1,
        facilityIds: [facility.id],
      },
      () => true,
    );

    // Should not throw an error
    await expect(centralSyncManager.addIncomingChanges(sessionId, changes)).resolves.not.toThrow();
  });
});
