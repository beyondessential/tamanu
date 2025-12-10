import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  waitForPushCompleted,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

describe('CentralSyncManager.addIncomingChanges', () => {
  let ctx;
  let models;
  let sequelize;

  const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;
  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
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
  it('does not record audit changelogs during incoming sync from facility server', async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '16');
    await models.Setting.set('audit.changes.enabled', true);
    const facility = await models.Facility.create(fake(models.Facility));
    const patient = await models.Patient.create(fake(models.Patient));
    const program = await models.Program.create(fake(models.Program));
    const clinician = await models.User.create(fakeUser());

    const programRegistry = await models.ProgramRegistry.create({
      ...fake(models.ProgramRegistry),
      programId: program.id,
    });

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

    await centralSyncManager.addIncomingChanges(sessionId, changes);
    await centralSyncManager.completePush(sessionId, facility.id, [
      'patient_program_registrations',
    ]);
    await waitForPushCompleted(centralSyncManager, sessionId);

    const changelogRecords = await sequelize.query(
      `SELECT * FROM logs.changes WHERE record_id = :recordId;`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          recordId: patientProgramRegistrationData.id,
        },
      },
    );

    expect(changelogRecords).toHaveLength(0);
  });

  it('records audit changelogs during incoming sync from mobile', async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '17');
    await models.Setting.set('audit.changes.enabled', true);
    const facility = await models.Facility.create(fake(models.Facility));
    const patient = await models.Patient.create(fake(models.Patient));
    const program = await models.Program.create(fake(models.Program));
    const clinician = await models.User.create(fakeUser());

    const programRegistry = await models.ProgramRegistry.create({
      ...fake(models.ProgramRegistry),
      programId: program.id,
    });

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
    const { sessionId } = await centralSyncManager.startSession({ isMobile: true });
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.addIncomingChanges(sessionId, changes);
    await centralSyncManager.completePush(sessionId, facility.id, [
      'patient_program_registrations',
    ]);
    await waitForPushCompleted(centralSyncManager, sessionId);

    const changelogRecords = await sequelize.query(
      `SELECT * FROM logs.changes WHERE record_id = :recordId;`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          recordId: patientProgramRegistrationData.id,
        },
      },
    );

    expect(changelogRecords).toHaveLength(1);
    expect(changelogRecords[0]).toMatchObject(
      expect.objectContaining({
        table_name: 'patient_program_registrations',
        record_id: patientProgramRegistrationData.id,
        record_data: expect.objectContaining({
          program_registry_id: programRegistry.id,
          clinician_id: clinician.id,
          patient_id: patient.id,
          facility_id: facility.id,
        }),
      }),
    );
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

    jest.doMock('@tamanu/database/sync', () => ({
      ...jest.requireActual('@tamanu/database/sync'),
      insertSnapshotRecords: jest.fn(),
    }));

    const centralSyncManager = initializeCentralSyncManager();

    const { insertSnapshotRecords } = require('@tamanu/database/sync');
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.addIncomingChanges(sessionId, changes);
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
