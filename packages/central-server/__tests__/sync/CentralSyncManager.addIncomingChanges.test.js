import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION, getModelsForPush } from '@tamanu/database/sync';
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
    vi.resetModules();
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
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, null);
    await models.SyncLookup.truncate({ force: true });
    await models.DebugLog.truncate({ force: true });
  });

  afterAll(() => ctx.close());
  it('does not record audit changelogs during incoming sync from facility server', async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '16');
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

    const centralSyncManager = await initializeCentralSyncManager({
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

    const centralSyncManager = await initializeCentralSyncManager({
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

    vi.doMock('@tamanu/database/sync', async () => ({
      ...(await vi.importActual('@tamanu/database/sync')),
      insertSnapshotRecords: vi.fn(),
    }));

    const centralSyncManager = await initializeCentralSyncManager();

    const { insertSnapshotRecords } = await import('@tamanu/database/sync');
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

  // spec: BTAG
  it('stores browser telemetry aggregates pushed from a facility', async () => {
    // An earlier test in this file mocks out snapshot inserts; vi.resetModules
    // does not clear vi.doMock registrations.
    vi.doUnmock('@tamanu/database/sync');
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '20');
    const facility = await models.Facility.create(fake(models.Facility));

    const trend = {
      id: 'trend-1',
      bucketStart: '2026-11-05T01:00:00.000Z',
      bucketMinutes: 60,
      interface: 'clinical',
      facilityId: facility.id,
      kind: 'navigation',
      route: '/patients/:patientId',
      method: null,
      appVersion: '2.70.0',
      eventCount: 2,
      settledCount: 2,
      timedCount: 2,
      totalDurationMs: 9000,
      durationHistogram: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
      p50DurationMs: 3000,
      p95DurationMs: 6000,
      p99DurationMs: 6000,
      maxDurationMs: 6000,
    };
    const slowEvent = {
      id: 'slow-event-1',
      trendId: trend.id,
      traceId: 'trace-1',
      spanId: 'span-1',
      kind: 'navigation',
      route: '/patients/:patientId',
      outcome: 'settled',
      durationMs: 6000,
      occurredAt: '2026-11-05T01:10:00.000Z',
      receivedAt: '2026-11-05T01:10:15.000Z',
      interface: 'clinical',
      facilityId: facility.id,
      appVersion: '2.70.0',
      deviceId: 'device-1',
      userId: 'user-1',
      pathParameters: { patientId: 'patient-1' },
      queryParameterNames: [],
    };
    const slowEventRequest = {
      id: 'slow-event-request-1',
      slowEventId: slowEvent.id,
      spanId: 'span-2',
      route: 'patient/:patientId',
      method: 'GET',
      statusCode: 200,
      durationMs: 5800,
      startOffsetMs: 40,
      pathParameters: { patientId: 'patient-1' },
      queryParameterNames: ['page'],
    };
    const changes = [
      ['browser_telemetry_trends', trend],
      ['browser_telemetry_slow_events', slowEvent],
      ['browser_telemetry_slow_event_requests', slowEventRequest],
    ].map(([recordType, data]) => ({
      direction: SYNC_SESSION_DIRECTION.OUTGOING,
      isDeleted: false,
      recordType,
      recordId: data.id,
      data,
    }));

    const centralSyncManager = await initializeCentralSyncManager({
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
      { since: 1, facilityIds: [facility.id] },
      () => true,
    );

    await centralSyncManager.addIncomingChanges(sessionId, changes);
    // Every table a facility pushes, as a real facility sync does.
    await centralSyncManager.completePush(
      sessionId,
      facility.id,
      Object.values(getModelsForPush(models)).map(model => model.tableName),
    );
    await waitForPushCompleted(centralSyncManager, sessionId);

    const storedTrend = await models.BrowserTelemetryTrend.findByPk(trend.id);
    expect(storedTrend.durationHistogram).toEqual(trend.durationHistogram);
    expect(storedTrend.facilityId).toBe(facility.id);
    const storedSlowEvent = await models.BrowserTelemetrySlowEvent.findByPk(slowEvent.id);
    expect(storedSlowEvent.trendId).toBe(trend.id);
    expect(storedSlowEvent.pathParameters).toEqual({ patientId: 'patient-1' });
    const storedRequest = await models.BrowserTelemetrySlowEventRequest.findByPk(
      slowEventRequest.id,
    );
    expect(storedRequest.slowEventId).toBe(slowEvent.id);
    expect(storedRequest.queryParameterNames).toEqual(['page']);
  });
});
