import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

describe('CentralSyncManager.getOutgoingChanges', () => {
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

  it('returns all the outgoing changes', async () => {
    const facility = await models.Facility.create(fake(models.Facility));
    const centralSyncManager = initializeCentralSyncManager();
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

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {
      limit: 10,
    });
    expect(changes.filter(({ recordId }) => recordId !== SYSTEM_USER_UUID)).toHaveLength(1);
  });

  it('returns all the outgoing changes with multiple facilities', async () => {
    const facility1 = await models.Facility.create(fake(models.Facility));
    const facility2 = await models.Facility.create(fake(models.Facility));
    const facility3 = await models.Facility.create(fake(models.Facility));
    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 1,
        facilityIds: [facility1.id, facility2.id, facility3.id],
      },
      () => true,
    );

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {
      limit: 10,
    });
    expect(changes.filter(({ recordId }) => recordId !== SYSTEM_USER_UUID)).toHaveLength(3);
  });

  it('includes audit changes in outgoing changes', async () => {
    // This test verifies that when audit.changes.enabled is true:
    // 1. A changelog record is created for the initial creation of a patient_program_registration
    // 2. Another changelog record is created when that registration is updated
    // 3. Both changelog records are attached to the outgoing sync snapshot record
    // 4. Each changelog record has the correct tableName and recordId as the record its attached to
    const OLD_SYNC_TICK = 10;
    const NEW_SYNC_TICK = 20;
    await models.Setting.set('audit.changes.enabled', true);
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);
    const facility = await models.Facility.create(fake(models.Facility));
    const patient = await models.Patient.create(fake(models.Patient));
    const program = await models.Program.create(fake(models.Program));
    const clinician = await models.User.create(fakeUser());

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);
    const programRegistry = await models.ProgramRegistry.create({
      ...fake(models.ProgramRegistry),
      programId: program.id,
    });
    const patientProgramRegistration = await models.PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        facilityId: facility.id,
      }),
    );
    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: patient.id,
      facilityId: facility.id,
    });

    patientProgramRegistration.date = '2025-04-22';
    await patientProgramRegistration.save();

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

    const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});

    const patientProgramRegistrationChange = outgoingChanges.find(
      c => c.recordType === 'patient_program_registrations',
    );
    expect(patientProgramRegistrationChange.changelogRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tableName: 'patient_program_registrations',
          recordId: patientProgramRegistrationChange.recordId,
        }),
        expect.objectContaining({
          tableName: 'patient_program_registrations',
          recordId: patientProgramRegistrationChange.recordId,
        }),
      ]),
    );
  });
  it('doesnt include previously synced audit changes in outgoing changes', async () => {
    const OLD_SYNC_TICK = 10;
    const NEW_SYNC_TICK = 20;
    const FINAL_SYNC_TICK = 30;
    await models.Setting.set('audit.changes.enabled', true);
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);
    const facility = await models.Facility.create(fake(models.Facility));
    const patient = await models.Patient.create(fake(models.Patient));
    const program = await models.Program.create(fake(models.Program));
    const clinician = await models.User.create(fakeUser());

    const programRegistry = await models.ProgramRegistry.create({
      ...fake(models.ProgramRegistry),
      programId: program.id,
    });
    const patientProgramRegistration = await models.PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        facilityId: facility.id,
      }),
    );
    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: patient.id,
      facilityId: facility.id,
    });

    patientProgramRegistration.date = '2025-04-22';
    await patientProgramRegistration.save();

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    await centralSyncManager.updateLookupTable();

    // First sync session
    const { sessionId: firstSessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, firstSessionId);

    await centralSyncManager.setupSnapshotForPull(
      firstSessionId,
      {
        since: 1,
        facilityIds: [facility.id],
      },
      () => true,
    );

    const firstOutgoingChanges = await centralSyncManager.getOutgoingChanges(firstSessionId, {});
    const firstPatientProgramRegistrationChange = firstOutgoingChanges.find(
      c => c.recordType === 'patient_program_registrations',
    );
    expect(firstPatientProgramRegistrationChange.changelogRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tableName: 'patient_program_registrations',
          recordId: patientProgramRegistration.id,
        }),
        expect.objectContaining({
          tableName: 'patient_program_registrations',
          recordId: patientProgramRegistration.id,
        }),
      ]),
    );

    // Make new changes after first sync
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, FINAL_SYNC_TICK);
    patientProgramRegistration.date = '2025-04-23 00:00:00';
    await patientProgramRegistration.save();

    await centralSyncManager.updateLookupTable();

    // Second sync session
    const { sessionId: secondSessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, secondSessionId);

    await centralSyncManager.setupSnapshotForPull(
      secondSessionId,
      {
        since: NEW_SYNC_TICK,
        facilityIds: [facility.id],
      },
      () => true,
    );

    const secondOutgoingChanges = await centralSyncManager.getOutgoingChanges(secondSessionId, {});
    const secondPatientProgramRegistrationChange = secondOutgoingChanges.find(
      c => c.recordType === 'patient_program_registrations',
    );

    // Verify only the new changelog record is included
    expect(secondPatientProgramRegistrationChange.changelogRecords).toHaveLength(1);
    expect(secondPatientProgramRegistrationChange.changelogRecords[0]).toEqual(
      expect.objectContaining({
        tableName: 'patient_program_registrations',
        recordId: patientProgramRegistration.id,
        recordData: expect.objectContaining({
          date: '2025-04-23 00:00:00',
        }),
      }),
    );
  });

  it('doesnt include changes after lookup table sync tick in outgoing changes', async () => {
    const OLD_SYNC_TICK = 10;
    const NEW_SYNC_TICK = 20;
    const FINAL_SYNC_TICK = 30;
    await models.Setting.set('audit.changes.enabled', true);
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);
    const facility = await models.Facility.create(fake(models.Facility));
    const patient = await models.Patient.create(fake(models.Patient));
    const program = await models.Program.create(fake(models.Program));
    const clinician = await models.User.create(fakeUser());

    const programRegistry = await models.ProgramRegistry.create({
      ...fake(models.ProgramRegistry),
      programId: program.id,
    });
    const patientProgramRegistration = await models.PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        facilityId: facility.id,
      }),
    );
    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: patient.id,
      facilityId: facility.id,
    });

    patientProgramRegistration.date = '2025-04-22 00:00:00';
    await patientProgramRegistration.save();

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);
    await centralSyncManager.updateLookupTable();

    // Make changes after lookup table update
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, FINAL_SYNC_TICK);
    patientProgramRegistration.date = '2025-04-23 00:00:00';
    await patientProgramRegistration.save();

    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: NEW_SYNC_TICK,
        facilityIds: [facility.id],
      },
      () => true,
    );

    const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const patientProgramRegistrationChange = outgoingChanges.find(
      c => c.recordType === 'patient_program_registrations',
    );

    // Verify that only changes up to NEW_SYNC_TICK are included
    // The change at FINAL_SYNC_TICK should not be included since it happened after the lookup table update
    expect(patientProgramRegistrationChange.changelogRecords).toHaveLength(2);
    expect(patientProgramRegistrationChange.changelogRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tableName: 'patient_program_registrations',
          recordId: patientProgramRegistration.id,
        }),
        expect.objectContaining({
          tableName: 'patient_program_registrations',
          recordId: patientProgramRegistration.id,
          recordData: expect.objectContaining({
            date: '2025-04-22 00:00:00',
          }),
        }),
      ]),
    );
  });

  it('changelog handles sync tick boundary conditions correctly', async () => {
    const BOUNDARY_SYNC_TICK = 20;
    const AFTER_BOUNDARY_SYNC_TICK = 21;
    await models.Setting.set('audit.changes.enabled', true);

    // Set up initial data
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, BOUNDARY_SYNC_TICK);
    const facility = await models.Facility.create(fake(models.Facility));
    const patient = await models.Patient.create(fake(models.Patient));
    const program = await models.Program.create(fake(models.Program));
    const clinician = await models.User.create(fakeUser());

    const programRegistry = await models.ProgramRegistry.create({
      ...fake(models.ProgramRegistry),
      programId: program.id,
    });
    const patientProgramRegistration = await models.PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        facilityId: facility.id,
      }),
    );
    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: patient.id,
      facilityId: facility.id,
    });

    // Make a change exactly at the boundary sync tick
    patientProgramRegistration.date = '2025-04-22 00:00:00';
    await patientProgramRegistration.save();

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Update lookup table at the boundary tick
    await centralSyncManager.updateLookupTable();

    // Make a change immediately after the boundary
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, AFTER_BOUNDARY_SYNC_TICK);
    patientProgramRegistration.date = '2025-04-23 00:00:00';
    await patientProgramRegistration.save();

    // Start sync session
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: BOUNDARY_SYNC_TICK,
        facilityIds: [facility.id],
      },
      () => true,
    );

    const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const patientProgramRegistrationChange = outgoingChanges.find(
      c => c.recordType === 'patient_program_registrations',
    );

    // Verify that the change at the boundary tick is included
    expect(patientProgramRegistrationChange.changelogRecords).toHaveLength(3);
    expect(patientProgramRegistrationChange.changelogRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tableName: 'patient_program_registrations',
          recordId: patientProgramRegistration.id,
        }),
        expect.objectContaining({
          tableName: 'patient_program_registrations',
          recordId: patientProgramRegistration.id,
          recordData: expect.objectContaining({
            date: '2025-04-22 00:00:00',
          }),
        }),
        expect.objectContaining({
          tableName: 'patient_program_registrations',
          recordId: patientProgramRegistration.id,
          recordData: expect.objectContaining({
            date: '2025-04-23 00:00:00',
            updated_at_sync_tick: AFTER_BOUNDARY_SYNC_TICK,
          }),
        }),
      ]),
    );
  });
});
