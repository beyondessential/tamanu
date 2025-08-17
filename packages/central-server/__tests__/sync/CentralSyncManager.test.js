import crypto from 'crypto';
import { Op } from 'sequelize';
import { endOfDay, parseISO, sub } from 'date-fns';

import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { randomLabRequest } from '@tamanu/database/demoData';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import {
  LAB_REQUEST_STATUSES,
  SETTING_KEYS,
  SETTINGS_SCOPES,
  SYNC_DIRECTIONS,
  DEBUG_LOG_TYPES,
  APPOINTMENT_STATUSES,
  REPEAT_FREQUENCY,
  SYSTEM_USER_UUID,
} from '@tamanu/constants';
import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';
import { settingsCache } from '@tamanu/settings';

import { createTestContext } from '../utilities';
import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../dist/admin/referenceDataImporter';
import { cloneDeep } from 'lodash';

const doImport = (options, models) => {
  const { file, ...opts } = options;
  return importerTransaction({
    referenceDataImporter,
    file: `./__tests__/sync/testData/${file}.xlsx`,
    models,
    ...opts,
  });
};

describe('CentralSyncManager', () => {
  let ctx;
  let models;
  let sequelize;

  const DEFAULT_CURRENT_SYNC_TIME_VALUE = 2;
  const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;
  const DEFAULT_CONFIG = {
    sync: {
      lookupTable: {
        enabled: false,
      },
      maxRecordsPerSnapshotChunk: 1000000000,
    },
  };

  const initializeCentralSyncManager = config => {
    // Have to load test function within test scope so that we can mock dependencies per test case
    const {
      CentralSyncManager: TestCentralSyncManager,
    } = require('../../dist/sync/CentralSyncManager');

    TestCentralSyncManager.overrideConfig(config || DEFAULT_CONFIG);

    return new TestCentralSyncManager(ctx);
  };

  const waitForSession = async (centralSyncManager, sessionId) => {
    let ready = false;
    while (!ready) {
      ready = await centralSyncManager.checkSessionReady(sessionId);
      await sleepAsync(100);
    }
  };

  const waitForPushCompleted = async (centralSyncManager, sessionId) => {
    let complete = false;
    while (!complete) {
      complete = await centralSyncManager.checkPushComplete(sessionId);
      await sleepAsync(100);
    }
  };

  const expectMatchingSessionData = (sessionData1, sessionData2) => {
    const cleanedSessionData1 = { ...sessionData1 };
    const cleanedSessionData2 = { ...sessionData2 };

    // Remove updatedAt and lastConnectionTime as these fields change on every connect, so they return false negatives when comparing session data
    delete cleanedSessionData1.updatedAt;
    delete cleanedSessionData2.updatedAt;
    delete cleanedSessionData1.lastConnectionTime;
    delete cleanedSessionData2.lastConnectionTime;

    expect(cleanedSessionData1).toEqual(cleanedSessionData2);
  };

  const prepareRecordsForSync = async () => {
    // Pre insert the records below for snapshotting later
    const facility = await models.Facility.create(fake(models.Facility));
    const program = await models.Program.create({
      id: 'test-program-1',
      name: 'Program',
    });
    const survey = await models.Survey.create({
      id: 'test-survey-1',
      programId: program.id,
    });

    return [facility, program, survey];
  };

  const prepareMockedPullOnlyModelQueryPromise = async () => {
    let resolveUpdateLookupTableWaitingPromise;
    const modelQueryWaitingPromise = new Promise(resolve => {
      resolveUpdateLookupTableWaitingPromise = async () => resolve(true);
    });

    // Build the fakeModelPromise so that it can block the snapshotting process,
    // then we can insert some new records while snapshotting is happening
    let resolveMockedQueryPromise;
    const mockedModelUpdateLookupTableQueryPromise = new Promise(resolve => {
      // count: 100 is not correct but shouldn't matter in this test case
      resolveMockedQueryPromise = async () => resolve([[{ maxId: null, count: 100 }]]);
    });
    const MockedPullOnlyModel = {
      syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      associations: [],
      getAttributes() {
        return {
          id: {},
          name: {},
        };
      },
      sequelize: {
        async query() {
          await resolveUpdateLookupTableWaitingPromise();
          return mockedModelUpdateLookupTableQueryPromise;
        },
      },
      buildSyncFilter: () => null,
      buildSyncLookupQueryDetails: () => null,
    };

    return {
      MockedPullOnlyModel,
      resolveMockedQueryPromise,
      modelQueryWaitingPromise,
    };
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, DEFAULT_CURRENT_SYNC_TIME_VALUE);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.Program.truncate({ cascade: true, force: true });
    await models.Survey.truncate({ cascade: true, force: true });
    await models.ProgramDataElement.truncate({ cascade: true, force: true });
    await models.SurveyScreenComponent.truncate({ cascade: true, force: true });
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

  describe('startSession', () => {
    it('creates a new session', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      const syncSession = await models.SyncSession.findOne({ where: { id: sessionId } });
      expect(syncSession).not.toBeUndefined();
    });

    it('tick-tocks the global clock', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();

      await waitForSession(centralSyncManager, sessionId);

      const localSystemFact = await models.LocalSystemFact.findOne({
        where: { key: FACT_CURRENT_SYNC_TICK },
      });
      expect(parseInt(localSystemFact.value, 10)).toBe(DEFAULT_CURRENT_SYNC_TIME_VALUE + 2);
    });

    it('allows concurrent sync sessions', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId: sessionId1 } = await centralSyncManager.startSession();
      const { sessionId: sessionId2 } = await centralSyncManager.startSession();

      await waitForSession(centralSyncManager, sessionId1);
      await waitForSession(centralSyncManager, sessionId2);

      const syncSession1 = await models.SyncSession.findOne({ where: { id: sessionId1 } });
      const syncSession2 = await models.SyncSession.findOne({ where: { id: sessionId2 } });

      expect(syncSession1).not.toBeUndefined();
      expect(syncSession2).not.toBeUndefined();
    });

    it('throws an error when checking a session is ready if it failed to start', async () => {
      const errorMessage = "I'm a sleepy session, I don't want to start";
      const fakeMarkAsStartedAt = () => {
        throw new Error(errorMessage);
      };

      const spyMarkAsStartedAt = jest
        .spyOn(models.SyncSession.prototype, 'markAsStartedAt')
        .mockImplementation(fakeMarkAsStartedAt);

      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();

      await expect(waitForSession(centralSyncManager, sessionId))
        .rejects.toThrow(`Sync session '${sessionId}' encountered an error: ${errorMessage}`)
        .finally(() => spyMarkAsStartedAt.mockRestore());
    });

    it('throws an error if the sync lookup table has not yet built', async () => {
      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: true,
          },
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });
      const { sessionId } = await centralSyncManager.startSession();
      await expect(waitForSession(centralSyncManager, sessionId)).rejects.toThrow(
        `Sync session '${sessionId}' encountered an error: Sync lookup table has not yet built. Cannot initiate sync.`,
      );
    });

    it('throws an error when checking a session is ready if it never assigned a started_at_tick', async () => {
      const fakeMarkAsStartedAt = () => {
        // Do nothing and ensure we error out when the client starts polling
      };

      const spyMarkAsStartedAt = jest
        .spyOn(models.SyncSession.prototype, 'markAsStartedAt')
        .mockImplementation(fakeMarkAsStartedAt);

      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();

      await expect(waitForSession(centralSyncManager, sessionId))
        .rejects.toThrow(
          new RegExp(
            `Sync session '${sessionId}' encountered an error: Session initiation incomplete, likely because the central server restarted during the process`,
          ),
        )
        .finally(() => spyMarkAsStartedAt.mockRestore());
    });

    /**
     * Since the client is polling to see if the session has started, its important we only mark as started once everything is complete
     */
    it('performs no further operations after flagging the session as started', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const originalPrepareSession = centralSyncManager.prepareSession.bind(centralSyncManager);
      let dataValuesAtStartTime = null;

      const fakeCentralSyncManagerPrepareSession = session => {
        const originalMarkAsStartedAt = session.markAsStartedAt.bind(session);
        const fakeSessionMarkAsStartedAt = async tick => {
          const result = await originalMarkAsStartedAt(tick);
          await session.reload();
          dataValuesAtStartTime = cloneDeep(session.dataValues); // Save dataValues immediately after marking session as started
          return result;
        };
        jest.spyOn(session, 'markAsStartedAt').mockImplementation(fakeSessionMarkAsStartedAt);
        return originalPrepareSession(session);
      };

      jest
        .spyOn(centralSyncManager, 'prepareSession')
        .mockImplementation(fakeCentralSyncManagerPrepareSession);

      const { sessionId } = await centralSyncManager.startSession();

      await waitForSession(centralSyncManager, sessionId);
      const latestValues = (await models.SyncSession.findOne({ where: { id: sessionId } }))
        .dataValues;

      expectMatchingSessionData(latestValues, dataValuesAtStartTime);
    });
  });

  describe('connectToSession', () => {
    it('allows connecting to an existing session', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      const syncSession = await centralSyncManager.connectToSession(sessionId);
      expect(syncSession).toBeDefined();
    });

    it('throws an error if connecting to a session that has errored out', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      const session = await models.SyncSession.findByPk(sessionId);
      await session.markErrored(
        'Snapshot processing incomplete, likely because the central server restarted during the snapshot',
      );

      await expect(centralSyncManager.connectToSession(sessionId)).rejects.toThrow(
        `Sync session '${sessionId}' encountered an error: Snapshot processing incomplete, likely because the central server restarted during the snapshot`,
      );
    });

    it("does not throw an error when connecting to a session that has not taken longer than configured 'syncSessionTimeoutMs'", async () => {
      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: false,
          },
          syncSessionTimeoutMs: 1000,
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      await sleepAsync(500);

      // updated_at will be set to timestamp that is 500ms later
      await centralSyncManager.connectToSession(sessionId);

      expect(() => centralSyncManager.connectToSession(sessionId)).not.toThrow();
    });

    it("throws an error when connecting to a session that has taken longer than configured 'syncSessionTimeoutMs'", async () => {
      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: false,
          },
          syncSessionTimeoutMs: 200,
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      await sleepAsync(500);

      // updated_at will be set to timestamp that is 500ms later
      await centralSyncManager.connectToSession(sessionId);

      await expect(centralSyncManager.connectToSession(sessionId)).rejects.toThrow(
        `Sync session '${sessionId}' encountered an error: Sync session ${sessionId} timed out`,
      );
    });

    it('append error if sync session already encounters an error before', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      const session = await models.SyncSession.findByPk(sessionId);
      await session.markErrored('Error 1');
      await session.markErrored('Error 2');

      expect(session.errors).toEqual(['Error 1', 'Error 2']);
    });
  });

  describe('endSession', () => {
    it('set completedAt when ending an existing session', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      await centralSyncManager.endSession(sessionId);
      const syncSession2 = await models.SyncSession.findOne({ where: { id: sessionId } });
      expect(syncSession2.completedAt).not.toBeUndefined();
    });

    it('throws an error when connecting to a session that already ended', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      await centralSyncManager.endSession(sessionId);
      await expect(centralSyncManager.connectToSession(sessionId)).rejects.toThrow();
    });
  });

  describe('getOutgoingChanges', () => {
    beforeEach(async () => {
      jest.resetModules();
    });

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

      const secondOutgoingChanges = await centralSyncManager.getOutgoingChanges(
        secondSessionId,
        {},
      );
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

  describe('setupSnapshotForPull', () => {
    describe('handles snapshot process', () => {
      it('returns all encounters for newly marked-for-sync patients', async () => {
        const OLD_SYNC_TICK = 10;
        const NEW_SYNC_TICK = 20;

        // ~ ~ ~ Set up old data
        await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);
        const patient1 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const patient2 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const patient3 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const thisFacility = await models.Facility.create({
          ...fake(models.Facility),
        });
        const otherFacility = await models.Facility.create({
          ...fake(models.Facility),
        });
        await models.User.create(fakeUser());
        await models.Department.create({
          ...fake(models.Department),
          facilityId: otherFacility.id,
        });
        await models.Location.create({
          ...fake(models.Location),
          facilityId: otherFacility.id,
        });
        const encounter1 = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient1.id,
        });
        const encounter2 = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient2.id,
        });
        const encounter3 = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient3.id,
        });

        await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

        // ~ ~ ~ Set up data for marked for sync patients
        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: patient1.id,
          facilityId: thisFacility.id,
        });
        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: patient2.id,
          facilityId: thisFacility.id,
        });

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 15,
            facilityIds: [thisFacility.id],
          },
          () => true,
        );

        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
        const encounterIds = outgoingChanges
          .filter(c => c.recordType === 'encounters')
          .map(c => c.recordId);

        // Assert if outgoing changes contain the encounters (fully) for the marked for sync patients
        expect(encounterIds).toEqual(expect.arrayContaining([encounter1.id, encounter2.id]));
        expect(encounterIds).not.toEqual(expect.arrayContaining([encounter3.id]));
      });

      it('returns all encounters for newly marked-for-sync patients across multiple facilities', async () => {
        const OLD_SYNC_TICK = 20;
        const NEW_SYNC_TICK = 30;

        // ~ ~ ~ Set up old data
        await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);
        const patient1 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const patient2 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const patient3 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const facility1 = await models.Facility.create({
          ...fake(models.Facility),
        });
        const facility2 = await models.Facility.create({
          ...fake(models.Facility),
        });
        const otherFacility = await models.Facility.create({
          ...fake(models.Facility),
        });
        await models.User.create(fakeUser());
        await models.Department.create({
          ...fake(models.Department),
          facilityId: otherFacility.id,
        });
        await models.Location.create({
          ...fake(models.Location),
          facilityId: otherFacility.id,
        });
        const encounter1 = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient1.id,
        });
        const encounter2 = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient2.id,
        });
        const encounter3 = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient2.id,
        });
        const encounter4 = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient3.id,
        });

        await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

        // ~ ~ ~ Set up data for marked for sync patients
        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: patient1.id,
          facilityId: facility1.id,
        });
        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: patient2.id,
          facilityId: facility2.id,
        });

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 15,
            facilityIds: [facility1.id, facility2.id],
          },
          () => true,
        );

        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
        const encounterIds = outgoingChanges
          .filter(c => c.recordType === 'encounters')
          .map(c => c.recordId);

        // Assert if outgoing changes contain the encounters (fully) for the marked for sync patients
        expect(encounterIds).toEqual(
          expect.arrayContaining([encounter1.id, encounter2.id, encounter3.id]),
        );
        expect(encounterIds).not.toEqual(expect.arrayContaining([encounter4.id]));
      });

      it('returns only newly created encounter for a previously marked-for-sync patient', async () => {
        const OLD_SYNC_TICK = 10;
        const NEW_SYNC_TICK = 20;

        // ~ ~ ~ Set up old data
        await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);
        const patient1 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const facility = await models.Facility.create({
          ...fake(models.Facility),
        });
        await models.User.create(fakeUser());
        await models.Department.create({
          ...fake(models.Department),
          facilityId: facility.id,
        });
        await models.Location.create({
          ...fake(models.Location),
          facilityId: facility.id,
        });
        // Create encounter 1 having the same sync tick as the patient_facility
        await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient1.id,
        });

        await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

        const encounter2 = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient1.id,
        });

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 15,
            facilityIds: [facility.id],
          },
          () => true,
        );

        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
        const sessionTwoEncounterIds = outgoingChanges
          .filter(c => c.recordType === 'encounters')
          .map(c => c.recordId);

        // Assert if outgoing changes contain only encounter2 and not encounter1
        expect(sessionTwoEncounterIds).toHaveLength(1);
        expect(sessionTwoEncounterIds[0]).toEqual(encounter2.id);
      });
    });

    describe('handles concurrent transactions', () => {
      afterEach(async () => {
        // Revert to the original models
        ctx.store.models = models;
      });

      it('excludes manually inserted records when main snapshot transaction already started', async () => {
        const [facility, program, survey] = await prepareRecordsForSync();

        // Build the fakeModelPromise so that it can block the snapshotting process,
        // then we can insert some new records while snapshotting is happening
        const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
          await prepareMockedPullOnlyModelQueryPromise();

        // Initialize CentralSyncManager with MockedPullOnlyModel
        ctx.store.models = {
          MockedPullOnlyModel,
          ...models,
        };

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession({
          isMobile: true,
        });
        await waitForSession(centralSyncManager, sessionId);

        // Start the snapshot process
        const snapshot = centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 1,
            facilityIds: [facility.id],
          },
          () => true,
        );

        // wait until setupSnapshotForPull() reaches snapshotting for MockedModel
        // and block the snapshotting process inside the wrapper transaction,
        await modelQueryWaitingPromise;

        // Insert the records just before we release the lock,
        // meaning that we're inserting the records below in the middle of the snapshotting process,
        // and they SHOULD NOT be included in the snapshot

        const survey2 = await models.Survey.create({
          id: 'test-survey-2',
          programId: program.id,
        });
        const dataElement = await models.ProgramDataElement.create({
          name: 'Profile picture',
          defaultText: 'abcd',
          code: 'ProfilePhoto',
          type: 'Photo',
        });
        await models.SurveyScreenComponent.create({
          dataElementId: dataElement.id,
          surveyId: survey2.id,
          componentIndex: 0,
          text: 'Photo',
          screenIndex: 0,
        });

        // Now release the lock to see if the snapshot captures the newly inserted records above
        await resolveMockedQueryPromise();
        await sleepAsync(20);

        await snapshot;

        // Check if only 3 pre inserted records were snapshotted
        // and not the ones that were inserted in the middle of the snapshot process
        const outgoingChanges = (await centralSyncManager.getOutgoingChanges(sessionId, {})).filter(
          ({ recordId }) => recordId !== SYSTEM_USER_UUID,
        );
        expect(outgoingChanges.length).toBe(3);
        expect(outgoingChanges.map(r => r.recordId).sort()).toEqual(
          [facility, program, survey].map(r => r.id).sort(),
        );
      });

      it('excludes imported records when main snapshot transaction already started', async () => {
        const [facility, program, survey] = await prepareRecordsForSync();
        // Build the fakeModelPromise so that it can block the snapshotting process,
        // then we can insert some new records while snapshotting is happening
        const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
          await prepareMockedPullOnlyModelQueryPromise();

        // Initialize CentralSyncManager with MockedPullOnlyModel
        ctx.store.models = {
          MockedPullOnlyModel,
          ...models,
        };

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession({
          isMobile: true,
        });
        await waitForSession(centralSyncManager, sessionId);

        // Start the snapshot process
        const snapshot = centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 1,
            facilityIds: [facility.id],
          },
          () => true,
        );

        // wait until setupSnapshotForPull() reaches snapshotting for MockedModel
        // and block the snapshotting process inside the wrapper transaction
        await modelQueryWaitingPromise;

        // Insert the records just before we release the lock,
        // meaning that we're inserting the records below in the middle of the snapshotting process,
        // and they SHOULD NOT be included in the snapshot
        await doImport({ file: 'refdata-valid', dryRun: false }, models);

        // Now release the lock to see if the snapshot captures the newly inserted records above
        await resolveMockedQueryPromise();
        await sleepAsync(20);

        await snapshot;

        // Check if only 3 pre inserted records were snapshotted
        // and not the ones that were inserted in the middle of the snapshot process
        const outgoingChanges = (await centralSyncManager.getOutgoingChanges(sessionId, {})).filter(
          ({ recordId }) => recordId !== SYSTEM_USER_UUID,
        );
        expect(outgoingChanges.length).toBe(3);
        expect(outgoingChanges.map(r => r.recordId).sort()).toEqual(
          [facility, program, survey].map(r => r.id).sort(),
        );
      });

      it('excludes inserted records from another sync session when snapshot transaction already started', async () => {
        const [facility, program, survey] = await prepareRecordsForSync();
        // Build the fakeModelPromise so that it can block the snapshotting process,
        // then we can insert some new records while snapshotting is happening
        const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
          await prepareMockedPullOnlyModelQueryPromise();

        // Initialize CentralSyncManager with MockedPullOnlyModel
        ctx.store.models = {
          MockedPullOnlyModel,
          ...models,
        };

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId: sessionIdOne } = await centralSyncManager.startSession({
          isMobile: true,
        });
        await waitForSession(centralSyncManager, sessionIdOne);

        // Start the snapshot process
        const snapshot = centralSyncManager.setupSnapshotForPull(
          sessionIdOne,
          {
            since: 1,
            facilityIds: [facility.id],
          },
          () => true,
        );

        // wait until setupSnapshotForPull() reaches snapshotting for MockedModel
        // and block the snapshotting process inside the wrapper transaction
        await modelQueryWaitingPromise;

        const patient1 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const patient2 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const patient3 = await models.Patient.create({
          ...fake(models.Patient),
        });

        const changes = [
          {
            direction: SYNC_SESSION_DIRECTION.OUTGOING,
            isDeleted: false,
            recordType: 'patients',
            recordId: patient1.id,
            data: patient1,
          },
          {
            direction: SYNC_SESSION_DIRECTION.OUTGOING,
            isDeleted: false,
            recordType: 'patients',
            recordId: patient2.id,
            data: patient2,
          },
          {
            direction: SYNC_SESSION_DIRECTION.OUTGOING,
            isDeleted: false,
            recordType: 'patients',
            recordId: patient3.id,
            data: patient3,
          },
        ];

        const { sessionId: sessionIdTwo } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionIdTwo);

        await centralSyncManager.addIncomingChanges(sessionIdTwo, changes);
        await centralSyncManager.completePush(sessionIdTwo);
        // Wait for persist of session 2 to complete
        await sleepAsync(100);

        // Now release the lock to see if the snapshot captures the newly inserted records above
        await resolveMockedQueryPromise();
        await sleepAsync(20);

        await snapshot;

        // Check if only 3 pre inserted records were snapshotted
        // and not the ones that were inserted in the middle of the snapshot process
        const outgoingChanges = (
          await centralSyncManager.getOutgoingChanges(sessionIdOne, {})
        ).filter(({ recordId }) => recordId !== SYSTEM_USER_UUID);

        expect(outgoingChanges.length).toBe(3);
        expect(outgoingChanges.map(r => r.recordId).sort()).toEqual(
          [facility, program, survey].map(r => r.id).sort(),
        );
      });
    });

    describe('handles sync special case configurations', () => {
      describe('syncAllLabRequests', () => {
        let facility;
        let otherFacility;
        let encounter1;
        let encounter2;
        let labTestPanelRequest1;
        let labRequest1;
        let labRequest2;
        let labRequest1Tests;
        let labRequest2Tests;
        let fullSyncedPatientEncounter;
        let fullSyncedPatientLabRequest;
        let fullSyncedPatientLabRequestTests;

        beforeEach(async () => {
          await models.Facility.truncate({ cascade: true, force: true });
          await models.Program.truncate({ cascade: true, force: true });
          await models.ReferenceData.truncate({
            cascade: true,
            force: true,
          });
          await models.User.destroy({
            where: {
              id: {
                [Op.not]: SYSTEM_USER_UUID,
              },
            },
            force: true,
          });
          await models.Patient.truncate({ cascade: true, force: true });
          await models.Encounter.truncate({ cascade: true, force: true });
          await models.LabRequest.truncate({ cascade: true, force: true });

          // Create the lab requests to be tested
          facility = await models.Facility.create(fake(models.Facility));
          otherFacility = await models.Facility.create(fake(models.Facility));
          await models.User.create(fakeUser());
          const department1 = await models.Department.create({
            ...fake(models.Department),
            facilityId: facility.id,
          });
          const department2 = await models.Department.create({
            ...fake(models.Department),
            facilityId: otherFacility.id,
          });
          const location1 = await models.Location.create({
            ...fake(models.Location),
            facilityId: facility.id,
          });
          const location2 = await models.Location.create({
            ...fake(models.Location),
            facilityId: otherFacility.id,
          });
          const patient1 = await models.Patient.create({
            ...fake(models.Patient),
          });
          const patient2 = await models.Patient.create({
            ...fake(models.Patient),
          });
          encounter1 = await models.Encounter.create({
            ...(await createDummyEncounter(models)),
            patientId: patient1.id,
            locationId: location2.id,
            departmentId: department2.id,
          });
          encounter2 = await models.Encounter.create({
            ...(await createDummyEncounter(models)),
            patientId: patient2.id,
            locationId: location2.id,
            departmentId: department2.id,
          });
          const category = await models.ReferenceData.create({
            id: 'test1',
            type: 'labTestCategory',
            code: 'test1',
            name: 'Test 1',
          });
          const labTestPanel = await models.LabTestPanel.create({
            ...fake(models.LabTestPanel),
            categoryId: category.id,
          });
          labTestPanelRequest1 = await models.LabTestPanelRequest.create({
            ...fake(models.LabTestPanelRequest),
            labTestPanelId: labTestPanel.id,
            encounterId: encounter1.id,
          });
          const labRequest1Data = await randomLabRequest(models, {
            patientId: patient1.id,
            encounterId: encounter1.id,
            status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
            labTestPanelRequestId: labTestPanelRequest1.id, // make one of them part of a panel
          });
          labRequest1 = await models.LabRequest.create(labRequest1Data);
          const labRequest1TestsData = labRequest1Data.labTestTypeIds.map(labTestTypeId => ({
            ...fake(models.LabTest),
            labRequestId: labRequest1.id,
            labTestTypeId,
          }));
          labRequest1Tests = await Promise.all(
            labRequest1TestsData.map(lt => models.LabTest.create(lt)),
          );
          const labRequest2Data = await randomLabRequest(models, {
            patientId: patient2.id,
            encounterId: encounter2.id,
            status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
          });
          labRequest2 = await models.LabRequest.create(labRequest2Data);
          const labRequest2TestsData = labRequest2Data.labTestTypeIds.map(labTestTypeId => ({
            ...fake(models.LabTest),
            labRequestId: labRequest2.id,
            labTestTypeId,
          }));
          labRequest2Tests = await Promise.all(
            labRequest2TestsData.map(lt => models.LabTest.create(lt)),
          );

          // Create marked for sync patient to test if lab request still sync through normal full sync
          const fullSyncedPatient = await models.Patient.create({
            ...fake(models.Patient),
          });
          fullSyncedPatientEncounter = await models.Encounter.create({
            ...(await createDummyEncounter(models)),
            patientId: fullSyncedPatient.id,
            locationId: location1.id,
            departmentId: department1.id,
          });
          const fullSyncedPatientLabRequestData = await randomLabRequest(models, {
            patientId: fullSyncedPatientEncounter.id,
            encounterId: fullSyncedPatientEncounter.id,
            status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
          });
          fullSyncedPatientLabRequest = await models.LabRequest.create(
            fullSyncedPatientLabRequestData,
          );
          const fullSyncedPatientLabRequestTestsData =
            fullSyncedPatientLabRequestData.labTestTypeIds.map(labTestTypeId => ({
              ...fake(models.LabTest),
              labRequestId: fullSyncedPatientLabRequest.id,
              labTestTypeId,
            }));
          fullSyncedPatientLabRequestTests = await Promise.all(
            fullSyncedPatientLabRequestTestsData.map(lt => models.LabTest.create(lt)),
          );
        });

        it('syncs all lab requests when enabled', async () => {
          // Enable syncAllLabRequests
          await models.Setting.create({
            facilityId: facility.id,
            key: 'sync.syncAllLabRequests',
            value: true,
            scope: SETTINGS_SCOPES.FACILITY,
          });

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

          const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});

          // Test if the outgoingChanges contain all the lab requests, and their associated records
          expect(outgoingChanges.map(r => r.recordId)).toEqual(
            expect.arrayContaining([
              encounter1.id,
              labTestPanelRequest1.id,
              labRequest1.id,
              ...labRequest1Tests.map(lt => lt.id),
              encounter2.id,
              labRequest2.id,
              ...labRequest2Tests.map(lt => lt.id),
              fullSyncedPatientEncounter.id,
              fullSyncedPatientLabRequest.id,
              ...fullSyncedPatientLabRequestTests.map(lt => lt.id),
            ]),
          );
          // Test that the outgoingChanges also contains the lab requests of the patients that are marked for sync
          expect(outgoingChanges.map(r => r.recordId)).toEqual(
            expect.arrayContaining([fullSyncedPatientEncounter.id, fullSyncedPatientLabRequest.id]),
          );
        });

        it('does not sync all lab requests when disabled', async () => {
          // Disable syncAllLabRequests
          await models.Setting.create({
            facilityId: facility.id,
            key: SETTING_KEYS.SYNC_ALL_LAB_REQUESTS,
            value: false,
            scope: SETTINGS_SCOPES.FACILITY,
          });

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

          const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});

          // Test that the outgoingChanges don't contain the lab requests of the patients that are not marked for sync
          expect(outgoingChanges.map(r => r.recordId)).not.toEqual(
            expect.arrayContaining([
              encounter1.id,
              labTestPanelRequest1.id,
              labRequest1.id,
              ...labRequest1Tests.map(lt => lt.id),
              encounter2.id,
              labRequest2.id,
              ...labRequest2Tests.map(lt => lt.id),
            ]),
          );
          // Test that the outgoingChanges contain the lab requests of the patients that are marked for sync
          expect(outgoingChanges.map(r => r.recordId)).toEqual(
            expect.arrayContaining([fullSyncedPatientEncounter.id, fullSyncedPatientLabRequest.id]),
          );
        });
      });
    });

    describe('handles in-flight transactions', () => {
      it('waits until all the in-flight transactions using previous ticks (within the range of syncing) to finish and snapshot them for outgoing changes', async () => {
        const OLD_SYNC_TICK_1 = '4';
        const OLD_SYNC_TICK_2 = '6';
        const OLD_SYNC_TICK_3 = '8';
        const CURRENT_SYNC_TICK = '10';
        const facility = await models.Facility.create({
          ...fake(models.Facility),
        });

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        // Insert PATIENT 1 using an old sync tick and don't commit the transaction yet
        await models.LocalSystemFact.set('currentSyncTick', OLD_SYNC_TICK_1);
        const transactionForPatient1 = await sequelize.transaction();
        const patient1 = await models.Patient.create(createDummyPatient(), {
          transaction: transactionForPatient1,
        });

        // Insert PATIENT 2 using an old sync tick and don't commit the transaction yet
        await models.LocalSystemFact.set('currentSyncTick', OLD_SYNC_TICK_2);
        const transactionForPatient2 = await sequelize.transaction();
        const patient2 = await models.Patient.create(createDummyPatient(), {
          transaction: transactionForPatient2,
        });

        // Insert PATIENT 3 using an old sync tick and don't commit the transaction yet
        await models.LocalSystemFact.set('currentSyncTick', OLD_SYNC_TICK_3);
        const transactionForPatient3 = await sequelize.transaction();
        const patient3 = await models.Patient.create(createDummyPatient(), {
          transaction: transactionForPatient3,
        });

        // Insert PATIENT 4 using the latest sync tick and commit the transaction
        await models.LocalSystemFact.set('currentSyncTick', CURRENT_SYNC_TICK);
        const patient4 = await models.Patient.create(createDummyPatient());

        const snapshotForPullPromise = centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 2,
            facilityIds: [facility.id],
          },
          () => true,
        );

        // Wait for the snapshot process to go through
        await sleepAsync(200);

        // Commit the transaction for patient 3 (the last inserted patient) first, then 2, then 1
        // so that we can also test an edge case when the previous transactions were still not committed
        await transactionForPatient3.commit();
        await sleepAsync(200);
        await transactionForPatient2.commit();
        await sleepAsync(200);
        await transactionForPatient1.commit();
        await snapshotForPullPromise;

        const changes = await centralSyncManager.getOutgoingChanges(sessionId, {
          limit: 10,
        });

        expect(changes).toHaveLength(4);

        expect(changes.map(c => c.data.id).sort()).toEqual(
          [patient1.id, patient2.id, patient3.id, patient4.id].sort(),
        );
      });
    });

    describe('handles discharging outpatients', () => {
      it("discharge outpatients when encounter's startDate is before today and pull the discharged encounter down ", async () => {
        // Set up data pre sync
        const CURRENT_SYNC_TICK = '6';
        const facility = await models.Facility.create(fake(models.Facility));
        await models.Department.create({
          ...fake(models.Department),
          facilityId: facility.id,
        });
        await models.Location.create({
          ...fake(models.Location),
          facilityId: facility.id,
        });
        await models.User.create(fakeUser());
        const patient = await models.Patient.create({
          ...fake(models.Patient),
        });
        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: patient.id,
          facilityId: facility.id,
        });

        await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, CURRENT_SYNC_TICK);

        // Encounter data for pushing (not inserted yet)
        const encounterData = {
          ...(await createDummyEncounter(models)),
          id: crypto.randomUUID(),
          patientId: patient.id,
          encounterType: 'clinic',
          startDate: toDateTimeString(sub(new Date(), { days: 1 })),
          endDate: null,
        };

        const changes = [
          {
            direction: SYNC_SESSION_DIRECTION.OUTGOING,
            isDeleted: false,
            recordType: 'encounters',
            recordId: encounterData.id,
            data: encounterData,
          },
        ];

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        // Push the encounter
        await centralSyncManager.addIncomingChanges(sessionId, changes);
        await centralSyncManager.completePush(sessionId, 'facility-a');
        await waitForPushCompleted(centralSyncManager, sessionId);

        // Start the snapshot for pull process
        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: CURRENT_SYNC_TICK - 2,
            facilityIds: [facility.id],
          },
          () => true,
        );

        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
        const returnedEncounter = outgoingChanges.find(c => c.recordType === 'encounters');

        const insertedEncounter = await models.Encounter.findByPk(encounterData.id);
        const expectedDischargedEndDate = toDateTimeString(
          endOfDay(parseISO(insertedEncounter.startDate)),
        );

        // Check if inserted encounter has endDate set
        expect(insertedEncounter.endDate).toBe(expectedDischargedEndDate);

        // outgoingChanges should contain:
        // 1 encounter, 1 note (system generated note for discharge), and 1 discharge
        expect(outgoingChanges).toHaveLength(3);
        expect(returnedEncounter.data.id).toBe(encounterData.id);
        expect(returnedEncounter.data.endDate).toBe(expectedDischargedEndDate);
        expect(outgoingChanges.find(c => c.recordType === 'notes')).toBeDefined();
        expect(outgoingChanges.find(c => c.recordType === 'discharges')).toBeDefined();
      });
    });

    describe('resolves duplicated display IDs', () => {
      it("appends 'duplicate' to existing patient and to-be-synced patient when the display IDs are duplicated", async () => {
        // Set up data pre sync
        const CURRENT_SYNC_TICK = '10';
        const facility = await models.Facility.create(fake(models.Facility));

        await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, CURRENT_SYNC_TICK);

        const duplicatedDisplayId = 'ABC';

        // Existing patient
        const existingPatient = await models.Patient.create({
          ...fake(models.Patient),
          displayId: duplicatedDisplayId,
        });

        // Patient data for pushing (not inserted yet)
        const toBeSyncedPatientData = {
          ...(await createDummyPatient(models)),
          id: crypto.randomUUID(),
          displayId: duplicatedDisplayId,
        };

        const changes = [
          {
            direction: SYNC_SESSION_DIRECTION.OUTGOING,
            isDeleted: false,
            recordType: 'patients',
            recordId: toBeSyncedPatientData.id,
            data: toBeSyncedPatientData,
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

        // Push the encounter
        await centralSyncManager.addIncomingChanges(sessionId, changes);
        await centralSyncManager.completePush(sessionId, facility.id);
        await waitForPushCompleted(centralSyncManager, sessionId);

        await centralSyncManager.updateLookupTable();

        // Start the snapshot for pull process
        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 1,
            facilityIds: [facility.id],
            deviceId: facility.id,
          },
          () => true,
        );

        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
        const returnedPatients = outgoingChanges.filter(c => c.recordType === 'patients');
        const returnedExistingPatient = returnedPatients.find(
          p => p.data.id === existingPatient.id,
        );
        const returnedSyncedPatient = returnedPatients.find(
          p => p.data.id === toBeSyncedPatientData.id,
        );

        const persistedSyncedPatient = await models.Patient.findByPk(toBeSyncedPatientData.id);
        const updatedExistingPatient = await models.Patient.findByPk(existingPatient.id);

        // Check if existing patient has displayId appended with _duplicate_1
        expect(updatedExistingPatient.displayId).toBe(`${duplicatedDisplayId}_duplicate_1`);

        // Check if inserted patient has displayId appended with _duplicate_2
        expect(persistedSyncedPatient.displayId).toBe(`${duplicatedDisplayId}_duplicate_2`);

        expect(returnedPatients).toHaveLength(2);

        // Check if pulled down existing patient also has displayId appended with _duplicate_2
        expect(returnedExistingPatient.data.displayId).toBe(`${duplicatedDisplayId}_duplicate_1`);

        // Check if pulled down synced patient also has displayId appended with _duplicate_2
        expect(returnedSyncedPatient.data.displayId).toBe(`${duplicatedDisplayId}_duplicate_2`);
      });

      it("does not append 'duplicate' to existing patient that is being updated", async () => {
        // Set up data pre sync
        const CURRENT_SYNC_TICK = '12';
        const facility = await models.Facility.create(fake(models.Facility));

        await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, CURRENT_SYNC_TICK);

        // Existing patient
        const existingPatient = await models.Patient.create({
          ...fake(models.Patient),
          displayId: 'DEF',
        });

        // Patient data for pushing (not inserted yet)
        const updatedPatientData = {
          ...existingPatient.dataValues,
          firstName: 'Changed',
        };

        const changes = [
          {
            direction: SYNC_SESSION_DIRECTION.OUTGOING,
            isDeleted: false,
            recordType: 'patients',
            recordId: updatedPatientData.id,
            data: updatedPatientData,
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

        // Push the encounter
        await centralSyncManager.addIncomingChanges(sessionId, changes);
        await centralSyncManager.completePush(sessionId, facility.id);
        await waitForPushCompleted(centralSyncManager, sessionId);

        await centralSyncManager.updateLookupTable();

        // Start the snapshot for pull process
        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 1,
            facilityIds: [facility.id],
            deviceId: facility.id,
          },
          () => true,
        );

        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
        const returnedPatients = outgoingChanges.filter(c => c.recordType === 'patients');

        // Check if no patient is updated and pulled back to facility
        expect(returnedPatients).toHaveLength(0);

        const existingPatientData = await models.Patient.findByPk(updatedPatientData.id);

        // Check if existing patient still has the same display ID and did not get duplicate appended
        expect(existingPatientData.displayId).toBe(updatedPatientData.displayId);
      });
    });
  });

  describe('resolves out of bounds appointments in cancelled schedule', () => {
    it('deletes out of bound appointments generated on central when syncing a schedule that has been cancelled', async () => {
      // Set up data pre sync
      const CURRENT_SYNC_TICK = '15';
      await models.Setting.set('appointments.maxRepeatingAppointmentsPerGeneration', 2);
      settingsCache.reset();
      const facility = await models.Facility.create(fake(models.Facility));
      const patient = await models.Patient.create({
        ...fake(models.Patient),
      });
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patient.id,
        facilityId: facility.id,
      });
      const locationGroup = await models.LocationGroup.create({
        ...fake(models.LocationGroup),
        facilityId: facility.id,
      });
      await models.ReferenceData.create({
        id: 'appointmentType-standard',
        type: 'appointmentType',
        code: 'standard',
        name: 'Standard',
      });
      const { schedule, firstAppointment } = await models.Appointment.createWithSchedule({
        settings: ctx.settings,
        appointmentData: {
          status: APPOINTMENT_STATUSES.CONFIRMED,
          startTime: '1990-10-02 12:00:00',
          endTime: '1990-10-02 13:00:00',
          locationGroupId: locationGroup.id,
          patientId: patient.id,
        },
        scheduleData: {
          // Until date covers 4 appointments, 2 of which will be initially created
          untilDate: '1990-10-23',
          interval: 1,
          frequency: REPEAT_FREQUENCY.WEEKLY,
          daysOfWeek: ['WE'],
        },
      });

      const createDataAppointment = firstAppointment.toCreateData();

      const appointmentsInSchedule = await schedule.getAppointments({
        order: [['startTime', 'ASC']],
      });

      // The remaining 2 appointments are created by scheduled task
      const generatedAppointments = await models.Appointment.bulkCreate([
        {
          ...createDataAppointment,
          startTime: '1990-10-16 12:00:00',
          endTime: '1990-10-16 13:00:00',
        },
        {
          ...createDataAppointment,
          startTime: '1990-10-23 12:00:00',
          endTime: '1990-10-23 13:00:00',
        },
      ]);

      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, CURRENT_SYNC_TICK);

      // Schedule is cancelled before the generated appointments had synced down.
      const toBeSyncedAppointmentData1 = {
        ...appointmentsInSchedule[0].get({ plain: true }),
        status: APPOINTMENT_STATUSES.CANCELLED,
      };
      const toBeSyncedAppointmentData2 = {
        ...appointmentsInSchedule[1].get({ plain: true }),
        status: APPOINTMENT_STATUSES.CANCELLED,
      };

      const toBeSyncedAppointmentScheduleData = {
        ...schedule.get({ plain: true }),
        // Facility is only aware that the first two appointments are generated at time of cancelling
        generatedUntilDate: '1990-10-09',
        cancelledAtDate: '1990-10-02',
        isFullyGenerated: true,
      };

      const changes = [
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'appointments',
          recordId: toBeSyncedAppointmentData1.id,
          data: toBeSyncedAppointmentData1,
        },
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'appointments',
          recordId: toBeSyncedAppointmentData2.id,
          data: toBeSyncedAppointmentData2,
        },
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'appointment_schedules',
          recordId: schedule.id,
          data: toBeSyncedAppointmentScheduleData,
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

      // Push the cancelled schedule
      await centralSyncManager.addIncomingChanges(sessionId, changes);
      await centralSyncManager.completePush(sessionId, facility.id);
      await waitForPushCompleted(centralSyncManager, sessionId);

      await centralSyncManager.updateLookupTable();

      // Start the snapshot for pull process
      await centralSyncManager.setupSnapshotForPull(
        sessionId,
        {
          since: 1,
          facilityIds: [facility.id],
          deviceId: facility.id,
        },
        () => true,
      );

      const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
      const returnedAppointments = outgoingChanges.filter(c => c.recordType === 'appointments');

      // Check if the out of bounds appointments are deleted
      expect(returnedAppointments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            isDeleted: true,
            data: expect.objectContaining({
              id: generatedAppointments[0].id,
            }),
          }),
          expect.objectContaining({
            isDeleted: true,
            data: expect.objectContaining({
              id: generatedAppointments[1].id,
            }),
          }),
        ]),
      );
    });
  });

  describe('syncDeviceTick', () => {
    beforeEach(async () => {
      jest.resetModules();
    });

    it('correctly sets the sync device tick for a sync', async () => {
      const INITIAL_SYNC_TICK = '16';
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, INITIAL_SYNC_TICK);
      const facility = await models.Facility.create(fake(models.Facility));

      // Existing patient
      const patient = await models.Patient.create({
        ...fake(models.Patient),
        displayId: 'DEF',
      });

      expect(patient.updatedAtSyncTick).toBe(INITIAL_SYNC_TICK);

      // Patient data for pushing (not inserted yet)
      const updatedPatientData = {
        ...patient.dataValues,
        firstName: 'Changed',
      };

      const changes = [
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'patients',
          recordId: updatedPatientData.id,
          data: updatedPatientData,
        },
      ];

      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession({ deviceId: facility.id });
      await waitForSession(centralSyncManager, sessionId);

      // Push the change
      await centralSyncManager.addIncomingChanges(sessionId, changes);
      await centralSyncManager.completePush(sessionId, facility.id);
      await waitForPushCompleted(centralSyncManager, sessionId);

      await patient.reload();

      // Check if patient updated and sync device tick is created and is unique
      expect(patient.displayId).toBe(updatedPatientData.displayId);
      expect(Number.parseInt(patient.updatedAtSyncTick, 10)).toBeGreaterThan(
        Number.parseInt(INITIAL_SYNC_TICK, 10),
      );
      expect(Number.parseInt(patient.updatedAtSyncTick, 10)).toBeLessThan(
        Number.parseInt(await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK), 10),
      );
      const syncDeviceTick = await models.SyncDeviceTick.findByPk(patient.updatedAtSyncTick);
      expect(syncDeviceTick.deviceId).toBe(facility.id);
    });

    it('prevents concurrent edits from sharing the same sync tick as the device sync tick', async () => {
      let tickTock;
      let unblockTickTock;
      const blockTickTockPromise = new Promise(resolve => {
        unblockTickTock = resolve;
      });

      let flagTickTockBlocked;
      const isTickTockBlockedPromise = new Promise(resolve => {
        flagTickTockBlocked = resolve;
      });

      const blockTickTock = () => {
        sequelize.transaction(async () => {
          await tickTock();
          await blockTickTockPromise;
        });
        flagTickTockBlocked();
      };
      const originalUpdateSnapshotRecords =
        jest.requireActual('@tamanu/database/sync').updateSnapshotRecords;
      const mockUpdateSnapshotRecords = jest.fn().mockImplementation(async (...args) => {
        // Block tickTock before completing the persist transaction so that we can test if concurrent edits share the same sync tick
        blockTickTock();
        return originalUpdateSnapshotRecords(...args);
      });

      jest.doMock('@tamanu/database/sync', () => ({
        ...jest.requireActual('@tamanu/database/sync'),
        updateSnapshotRecords: mockUpdateSnapshotRecords,
      }));

      const INITIAL_SYNC_TICK = '16';
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, INITIAL_SYNC_TICK);
      const facility = await models.Facility.create(fake(models.Facility));

      // Existing patient
      const patient = await models.Patient.create({
        ...fake(models.Patient),
        displayId: 'DEF',
      });

      expect(patient.updatedAtSyncTick).toBe(INITIAL_SYNC_TICK);

      // Patient data for pushing (not inserted yet)
      const updatedPatientData = {
        ...patient.dataValues,
        firstName: 'Changed',
      };

      const changes = [
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'patients',
          recordId: updatedPatientData.id,
          data: updatedPatientData,
        },
      ];

      const centralSyncManager = initializeCentralSyncManager();
      tickTock = centralSyncManager.tickTockGlobalClock.bind(centralSyncManager);
      const { sessionId } = await centralSyncManager.startSession({ deviceId: facility.id });
      await waitForSession(centralSyncManager, sessionId);

      // Push the change
      await centralSyncManager.addIncomingChanges(sessionId, changes);
      centralSyncManager.completePush(sessionId, facility.id);

      // Mid push, make a concurrent edit to see if it shares the same sync tick as the device sync tick
      await isTickTockBlockedPromise;
      const concurrentEdit = await models.Patient.create({
        ...fake(models.Patient),
        displayId: 'GHI',
      });
      unblockTickTock();
      await waitForPushCompleted(centralSyncManager, sessionId);

      await patient.reload();

      // Check if patient updated and the concurrent edit has a different sync tick
      expect(patient.displayId).toBe(updatedPatientData.displayId);
      expect(patient.updatedAtSyncTick).not.toBe(concurrentEdit.updatedAtSyncTick);
      const syncDeviceTick = await models.SyncDeviceTick.findByPk(patient.updatedAtSyncTick);
      expect(syncDeviceTick.deviceId).toBe(facility.id);
    });
  });

  describe('addIncomingChanges', () => {
    beforeEach(async () => {
      jest.resetModules();
    });

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

  describe('updateLookupTable', () => {
    beforeEach(async () => {
      jest.resetModules();
    });

    afterEach(async () => {
      // Revert to the original models
      ctx.store.models = models;
    });

    it('inserts records into sync lookup table', async () => {
      const patient1 = await models.Patient.create(fake(models.Patient));

      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: true,
          },
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });

      await centralSyncManager.updateLookupTable();

      const lookupData = await models.SyncLookup.findAll({
        where: {
          recordId: {
            [Op.not]: SYSTEM_USER_UUID,
          },
        },
      });

      expect(lookupData).toHaveLength(1);
      expect(lookupData[0]).toEqual(
        expect.objectContaining({
          recordId: patient1.id,
          recordType: 'patients',
          data: expect.objectContaining({
            id: patient1.id,
            displayId: patient1.displayId,
            firstName: patient1.firstName,
            middleName: patient1.middleName,
            lastName: patient1.lastName,
            culturalName: patient1.culturalName,
            dateOfBirth: patient1.dateOfBirth,
            dateOfDeath: null,
            sex: patient1.sex,
            email: patient1.email,
            visibilityStatus: patient1.visibilityStatus,
            villageId: null,
            mergedIntoId: null,
          }),
          isLabRequest: false,
          isDeleted: false,
        }),
      );
    });

    it('updates new changes from records into sync lookup table', async () => {
      const patient1 = await models.Patient.create(fake(models.Patient));

      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: true,
          },
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });

      const currentSyncTime = await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);

      await centralSyncManager.updateLookupTable();

      const lookupData = await models.SyncLookup.findAll({
        where: {
          recordId: {
            [Op.not]: SYSTEM_USER_UUID,
          },
        },
      });

      expect(lookupData).toHaveLength(1);
      expect(lookupData[0]).toEqual(
        expect.objectContaining({
          recordId: patient1.id,
          recordType: 'patients',
          data: expect.objectContaining({
            id: patient1.id,
            displayId: patient1.displayId,
            firstName: patient1.firstName,
            middleName: patient1.middleName,
            lastName: patient1.lastName,
            culturalName: patient1.culturalName,
            dateOfBirth: patient1.dateOfBirth,
            dateOfDeath: null,
            sex: patient1.sex,
            email: patient1.email,
            visibilityStatus: patient1.visibilityStatus,
            villageId: null,
            mergedIntoId: null,
          }),
          isLabRequest: false,
          isDeleted: false,
          updatedAtSyncTick: currentSyncTime,
        }),
      );

      patient1.firstName = 'New First Name';
      await patient1.save();

      await centralSyncManager.updateLookupTable();
      const lookupData2 = await models.SyncLookup.findAll({
        where: {
          recordId: {
            [Op.not]: SYSTEM_USER_UUID,
          },
        },
      });

      const newCurrentSyncTime = (await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK)) - 1;

      expect(lookupData2).toHaveLength(1);
      expect(lookupData2[0]).toEqual(
        expect.objectContaining({
          recordId: patient1.id,
          recordType: 'patients',
          data: expect.objectContaining({
            id: patient1.id,
            displayId: patient1.displayId,
            firstName: 'New First Name',
            middleName: patient1.middleName,
            lastName: patient1.lastName,
            culturalName: patient1.culturalName,
            dateOfBirth: patient1.dateOfBirth,
            dateOfDeath: null,
            sex: patient1.sex,
            email: patient1.email,
            visibilityStatus: patient1.visibilityStatus,
            villageId: null,
            mergedIntoId: null,
          }),
          isLabRequest: false,
          isDeleted: false,
          updatedAtSyncTick: newCurrentSyncTime.toString(), // we take the tick for this
        }),
      );
    });

    it('allows having the same recordId but different record_type in sync lookup table', async () => {
      const patient1 = await models.Patient.create(fake(models.Patient));
      await models.ReferenceData.create(
        fake(models.ReferenceData, { id: patient1.id }), // use the same id between patient and reference_data
      );

      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: true,
          },
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });

      const currentSyncTime = await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);

      await centralSyncManager.updateLookupTable();

      const lookupData = await models.SyncLookup.findAll({
        where: {
          recordId: {
            [Op.not]: SYSTEM_USER_UUID,
          },
        },
      });

      expect(lookupData).toHaveLength(2);
      expect(lookupData.find(d => d.recordType === 'patients')).toEqual(
        expect.objectContaining({
          recordId: patient1.id,
          recordType: 'patients',
          data: expect.objectContaining({
            id: patient1.id,
            displayId: patient1.displayId,
            firstName: patient1.firstName,
            middleName: patient1.middleName,
            lastName: patient1.lastName,
            culturalName: patient1.culturalName,
            dateOfBirth: patient1.dateOfBirth,
            dateOfDeath: null,
            sex: patient1.sex,
            email: patient1.email,
            visibilityStatus: patient1.visibilityStatus,
            villageId: null,
            mergedIntoId: null,
          }),
          isLabRequest: false,
          isDeleted: false,
          updatedAtSyncTick: currentSyncTime,
        }),
      );

      patient1.firstName = 'New First Name';
      await patient1.save();

      await centralSyncManager.updateLookupTable();
      const lookupData2 = await models.SyncLookup.findAll({
        where: {
          recordId: {
            [Op.not]: SYSTEM_USER_UUID,
          },
        },
      });

      const newCurrentSyncTime = (await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK)) - 1;

      expect(lookupData2).toHaveLength(2);
      expect(lookupData2.find(d => d.recordType === 'patients')).toEqual(
        expect.objectContaining({
          recordId: patient1.id,
          recordType: 'patients',
          data: expect.objectContaining({
            id: patient1.id,
            displayId: patient1.displayId,
            firstName: 'New First Name',
            middleName: patient1.middleName,
            lastName: patient1.lastName,
            culturalName: patient1.culturalName,
            dateOfBirth: patient1.dateOfBirth,
            dateOfDeath: null,
            sex: patient1.sex,
            email: patient1.email,
            visibilityStatus: patient1.visibilityStatus,
            villageId: null,
            mergedIntoId: null,
          }),
          isLabRequest: false,
          isDeleted: false,
          updatedAtSyncTick: newCurrentSyncTime.toString(),
        }),
      );
    });

    it('does not include records inserted when updating lookup table already started', async () => {
      const records = await prepareRecordsForSync();
      const program = records[1];

      // Build the fakeModelPromise so that it can block the updateLookupTable process,
      // then we can insert some new records while updateLookupTable is happening
      const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
        await prepareMockedPullOnlyModelQueryPromise();

      ctx.store.models = {
        MockedPullOnlyModel,
        ...models,
      };

      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: true,
          },
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });

      // Start the update lookup table process
      const updateLookupTablePromise = centralSyncManager.updateLookupTable();

      // wait until updateLookupTable() reaches the point of querying for MockedModel
      // and block the process inside the wrapper transaction,
      await modelQueryWaitingPromise;

      // Insert the records just before we release the lock,
      // meaning that we're inserting the records below in the middle of the updateLookupTable process,
      // and they SHOULD NOT be included sync_lookup
      const survey2 = await models.Survey.create({
        id: 'test-survey-2',
        programId: program.id,
      });
      const dataElement = await models.ProgramDataElement.create({
        name: 'Profile picture',
        defaultText: 'abcd',
        code: 'ProfilePhoto',
        type: 'Photo',
      });
      await models.SurveyScreenComponent.create({
        dataElementId: dataElement.id,
        surveyId: survey2.id,
        componentIndex: 0,
        text: 'Photo',
        screenIndex: 0,
      });

      // Now release the lock to see if the lookup table captures the newly inserted records above
      await resolveMockedQueryPromise();
      await sleepAsync(20);

      await updateLookupTablePromise;

      const lookupData = await models.SyncLookup.findAll({
        where: {
          recordId: {
            [Op.not]: SYSTEM_USER_UUID,
          },
        },
      });

      // only expect 3 records as it should not include the 3 records inserted manually
      expect(lookupData).toHaveLength(3);
    });

    it('does not include records inserted from importer when updating lookup table already started', async () => {
      await prepareRecordsForSync();

      // Build the fakeModelPromise so that it can block the updateLookupTable process,
      // then we can insert some new records while updateLookupTable is happening
      const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
        await prepareMockedPullOnlyModelQueryPromise();

      ctx.store.models = {
        MockedPullOnlyModel,
        ...models,
      };

      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: true,
          },
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });

      // Start the update lookup table process
      const updateLookupTablePromise = centralSyncManager.updateLookupTable();

      // wait until updateLookupTable() reaches the point of querying for MockedModel
      // and block the process inside the wrapper transaction,
      await modelQueryWaitingPromise;

      // Insert the records just before we release the lock,
      // meaning that we're inserting the records below in the middle of the updateLookupTable process.
      // and they SHOULD NOT be included sync_lookup,
      await doImport({ file: 'refdata-valid', dryRun: false }, models);

      // Now release the lock to see if the lookup table captures the newly inserted records above
      await resolveMockedQueryPromise();
      await sleepAsync(20);

      await updateLookupTablePromise;

      const lookupData = await models.SyncLookup.findAll({
        where: {
          recordId: {
            [Op.not]: SYSTEM_USER_UUID,
          },
        },
      });

      // only expect 3 records as it should not include the 3 records inserted from the importer
      expect(lookupData).toHaveLength(3);
    });

    it('does not include records inserted from another sync session when updating lookup table already started', async () => {
      await prepareRecordsForSync();

      // Build the fakeModelPromise so that it can block the updateLookupTable process,
      // then we can insert some new records while updateLookupTable is happening
      const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
        await prepareMockedPullOnlyModelQueryPromise();

      ctx.store.models = {
        MockedPullOnlyModel,
        ...models,
      };

      const centralSyncManager = initializeCentralSyncManager();

      // Start the update lookup table process
      const updateLookupTablePromise = centralSyncManager.updateLookupTable();

      // wait until updateLookupTable() reaches the point of querying for MockedModel
      // and block the process inside the wrapper transaction,
      await modelQueryWaitingPromise;

      const patient1 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const patient2 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const patient3 = await models.Patient.create({
        ...fake(models.Patient),
      });

      const changes = [
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'patients',
          recordId: patient1.id,
          data: patient1,
        },
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'patients',
          recordId: patient2.id,
          data: patient2,
        },
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'patients',
          recordId: patient3.id,
          data: patient3,
        },
      ];

      const { sessionId: sessionIdTwo } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionIdTwo);

      await centralSyncManager.addIncomingChanges(sessionIdTwo, changes);
      await centralSyncManager.completePush(sessionIdTwo);

      // Now release the lock to see if the lookup table captures the newly inserted records above
      await resolveMockedQueryPromise();
      await sleepAsync(20);

      await updateLookupTablePromise;

      const lookupData = await models.SyncLookup.findAll({
        where: {
          recordId: {
            [Op.not]: SYSTEM_USER_UUID,
          },
        },
      });
      // only expect 3 records as it should not include the 3 records inserted from another sync session
      expect(lookupData).toHaveLength(3);
    });

    it('records info about updating sync_lookup in debug log', async () => {
      await models.Patient.create(fake(models.Patient));

      await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, 6);

      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: true,
          },
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });

      await centralSyncManager.updateLookupTable();

      const debugLogs = await models.DebugLog.findAll({});
      expect(debugLogs).toHaveLength(1);
      expect(debugLogs[0]).toMatchObject({
        id: expect.anything(),
        type: DEBUG_LOG_TYPES.SYNC_LOOKUP_UPDATE,
        info: {
          since: '6',
          changesCount: 0,
          startedAt: expect.anything(),
          completedAt: expect.anything(),
        },
      });
    });

    it('records error thrown when updating sync_lookup in debug log', async () => {
      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: true,
          },
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });

      centralSyncManager.tickTockGlobalClock = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      try {
        await centralSyncManager.updateLookupTable();
      } catch (e) {
        //swallow error
      }

      const debugLogs = await models.DebugLog.findAll({});
      expect(debugLogs).toHaveLength(1);
      expect(debugLogs[0]).toMatchObject({
        id: expect.anything(),
        type: DEBUG_LOG_TYPES.SYNC_LOOKUP_UPDATE,
        info: {
          error: 'Test error',
          startedAt: expect.anything(),
          completedAt: expect.anything(),
        },
      });
    });
  });

  describe('facility sensitivity sync filtering', () => {
    let patient;
    let practitioner;
    let sensitiveEncounter;
    let sensitiveFacility;
    let nonSensitiveEncounter;
    let nonSensitiveFacility;

    const lookupEnabledConfig = {
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    };

    beforeEach(async () => {
      patient = await models.Patient.create(fake(models.Patient));
      practitioner = await models.User.create(fake(models.User));
      // Reset modules to ensure fresh imports
      jest.resetModules();
      // The config override actually doesn't apply to snapshotOutgoingChanges which uses the test.json, so we need to mock it directly here
      jest.doMock('@tamanu/shared/utils/withConfig', () => ({
        withConfig: fn => {
          const inner = function inner(...args) {
            return fn(...args, lookupEnabledConfig);
          };
          inner.overrideConfig = fn;
          return inner;
        },
      }));

      sensitiveFacility = await models.Facility.create(
        fake(models.Facility, { isSensitive: true }),
      );
      const sensitiveDepartment = await models.Department.create(
        fake(models.Department, { facilityId: sensitiveFacility.id }),
      );
      const sensitiveLocation = await models.Location.create(
        fake(models.Location, { facilityId: sensitiveFacility.id }),
      );
      sensitiveEncounter = await models.Encounter.create({
        ...fake(models.Encounter),
        patientId: patient.id,
        locationId: sensitiveLocation.id,
        departmentId: sensitiveDepartment.id,
        examinerId: practitioner.id,
        endDate: null,
      });
      nonSensitiveFacility = await models.Facility.create(
        fake(models.Facility, { isSensitive: false }),
      );
      const nonSensitiveDepartment = await models.Department.create(
        fake(models.Department, { facilityId: nonSensitiveFacility.id }),
      );
      const nonSensitiveLocation = await models.Location.create(
        fake(models.Location, { facilityId: nonSensitiveFacility.id }),
      );
      nonSensitiveEncounter = await models.Encounter.create({
        ...fake(models.Encounter),
        patientId: patient.id,
        locationId: nonSensitiveLocation.id,
        departmentId: nonSensitiveDepartment.id,
        examinerId: practitioner.id,
        endDate: null,
      });
    });

    const getOutgoingIdsForRecordType = async (centralSyncManager, facilityId, recordType) => {
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      await centralSyncManager.setupSnapshotForPull(
        sessionId,
        {
          since: 1,
          facilityIds: [facilityId],
        },
        () => true,
      );

      const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
      return outgoingChanges.filter(c => c.recordType === recordType).map(c => c.recordId);
    };

    it('will populate the lookup table with a facility id appropriately for sensitive encounters', async () => {
      const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
      await centralSyncManager.updateLookupTable();

      const lookupData = await models.SyncLookup.findAll();
      const sensitiveLookupRecord = lookupData.find(l => l.recordId === sensitiveEncounter.id);
      const nonSensitiveLookupRecord = lookupData.find(
        l => l.recordId === nonSensitiveEncounter.id,
      );

      expect(sensitiveLookupRecord.facilityId).toBe(sensitiveFacility.id);
      expect(nonSensitiveLookupRecord.facilityId).toBeNull();
    });

    it('will sync sensitive encounters to itself', async () => {
      const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
      await centralSyncManager.updateLookupTable();

      const encounterIds = await getOutgoingIdsForRecordType(
        centralSyncManager,
        sensitiveFacility.id,
        'encounters',
      );
      expect(encounterIds).toContain(sensitiveEncounter.id);
      expect(encounterIds).toContain(nonSensitiveEncounter.id);
    });

    describe('check sensitive encounter linked data types are not syncing to any other facility', () => {
      // Every test in this describe block should use this function to check that the sensitive record
      // is not synced to the non-sensitive facility
      const checkSensitiveRecordFiltering = async ({ model, sensitiveId, nonSensitiveId }) => {
        const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
        await centralSyncManager.updateLookupTable();

        const recordIds = await getOutgoingIdsForRecordType(
          centralSyncManager,
          nonSensitiveFacility.id,
          model.tableName,
        );

        if (recordIds.length === 0) {
          throw new Error(
            `No records found for record type ${model.tableName} in lookup table, Check the test setup!`,
          );
        }

        expect(recordIds).not.toContain(sensitiveId);
        expect(recordIds).toContain(nonSensitiveId);
      };

      // Basic encounter
      it("won't sync sensitive encounters", async () => {
        await checkSensitiveRecordFiltering({
          model: models.Encounter,
          sensitiveId: sensitiveEncounter.id,
          nonSensitiveId: nonSensitiveEncounter.id,
        });
      });

      it("won't sync sensitive encounter triage", async () => {
        const triagePatientA = await models.Patient.create(fake(models.Patient));
        const triagePatientB = await models.Patient.create(fake(models.Patient));
        const sensitiveTriage = await models.Triage.create({
          ...fake(models.Triage),
          patientId: triagePatientA.id,
          departmentId: sensitiveEncounter.departmentId,
          locationId: sensitiveEncounter.locationId,
          practitionerId: sensitiveEncounter.examinerId,
          triageTime: getCurrentDateTimeString(),
        });
        const nonSensitiveTriage = await models.Triage.create({
          ...fake(models.Triage),
          patientId: triagePatientB.id,
          departmentId: nonSensitiveEncounter.departmentId,
          locationId: nonSensitiveEncounter.locationId,
          practitionerId: nonSensitiveEncounter.examinerId,
          triageTime: getCurrentDateTimeString(),
        });

        await checkSensitiveRecordFiltering({
          model: models.Encounter,
          sensitiveId: sensitiveTriage.encounterId,
          nonSensitiveId: nonSensitiveTriage.encounterId,
        });

        await checkSensitiveRecordFiltering({
          model: models.Triage,
          sensitiveId: sensitiveTriage.id,
          nonSensitiveId: nonSensitiveTriage.id,
        });
      });

      it("won't sync sensitive encounter discharge", async () => {
        const sensitiveDischarge = await models.Discharge.create(
          fake(models.Discharge, {
            encounterId: sensitiveEncounter.id,
          }),
        );
        const nonSensitiveDischarge = await models.Discharge.create(
          fake(models.Discharge, {
            encounterId: nonSensitiveEncounter.id,
          }),
        );
        await checkSensitiveRecordFiltering({
          model: models.Discharge,
          sensitiveId: sensitiveDischarge.id,
          nonSensitiveId: nonSensitiveDischarge.id,
        });
      });

      it("won't sync sensitive encounter history", async () => {
        const sensitiveEncounterHistory = await models.EncounterHistory.findOne({
          where: {
            encounterId: sensitiveEncounter.id,
          },
        });
        const nonSensitiveEncounterHistory = await models.EncounterHistory.findOne({
          where: {
            encounterId: nonSensitiveEncounter.id,
          },
        });
        await checkSensitiveRecordFiltering({
          model: models.EncounterHistory,
          sensitiveId: sensitiveEncounterHistory.id,
          nonSensitiveId: nonSensitiveEncounterHistory.id,
        });
      });

      it("won't sync sensitive encounter procedures", async () => {
        // Create procedures linked to encounters
        const sensitiveProcedure = await models.Procedure.create(
          fake(models.Procedure, {
            encounterId: sensitiveEncounter.id,
          }),
        );
        const nonSensitiveProcedure = await models.Procedure.create(
          fake(models.Procedure, {
            encounterId: nonSensitiveEncounter.id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.Procedure,
          sensitiveId: sensitiveProcedure.id,
          nonSensitiveId: nonSensitiveProcedure.id,
        });
      });

      it("won't sync sensitive encounter notes", async () => {
        // Create notes linked to encounters
        const sensitiveNote = await models.Note.create(
          fake(models.Note, {
            recordId: sensitiveEncounter.id,
            recordType: 'Encounter',
          }),
        );
        const nonSensitiveNote = await models.Note.create(
          fake(models.Note, {
            recordId: nonSensitiveEncounter.id,
            recordType: 'Encounter',
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.Note,
          sensitiveId: sensitiveNote.id,
          nonSensitiveId: nonSensitiveNote.id,
        });
      });

      it("won't sync sensitive encounter diagnoses", async () => {
        const sensitiveDiagnosis = await models.EncounterDiagnosis.create(
          fake(models.EncounterDiagnosis, {
            encounterId: sensitiveEncounter.id,
            diagnosisId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
          }),
        );
        const nonSensitiveDiagnosis = await models.EncounterDiagnosis.create(
          fake(models.EncounterDiagnosis, {
            encounterId: nonSensitiveEncounter.id,
            diagnosisId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.EncounterDiagnosis,
          sensitiveId: sensitiveDiagnosis.id,
          nonSensitiveId: nonSensitiveDiagnosis.id,
        });
      });

      it("won't sync sensitive encounter tasks", async () => {
        const sensitiveTask = await models.Task.create(
          fake(models.Task, {
            encounterId: sensitiveEncounter.id,
            requestedByUserId: practitioner.id,
          }),
        );
        const nonSensitiveTask = await models.Task.create(
          fake(models.Task, {
            encounterId: nonSensitiveEncounter.id,
            requestedByUserId: practitioner.id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.Task,
          sensitiveId: sensitiveTask.id,
          nonSensitiveId: nonSensitiveTask.id,
        });
      });

      it("won't sync sensitive encounter encounter diets", async () => {
        const sensitiveDiet = await models.EncounterDiet.create(
          fake(models.EncounterDiet, {
            encounterId: sensitiveEncounter.id,
            dietId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
          }),
        );
        const nonSensitiveDiet = await models.EncounterDiet.create(
          fake(models.EncounterDiet, {
            encounterId: nonSensitiveEncounter.id,
            dietId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.EncounterDiet,
          sensitiveId: sensitiveDiet.id,
          nonSensitiveId: nonSensitiveDiet.id,
        });
      });

      it("won't sync sensitive encounter administered vaccines", async () => {
        const sensitiveAdministeredVaccine = await models.AdministeredVaccine.create(
          fake(models.AdministeredVaccine, {
            encounterId: sensitiveEncounter.id,
            scheduledVaccineId: (
              await models.ScheduledVaccine.create(fake(models.ScheduledVaccine))
            ).id,
          }),
        );
        const nonSensitiveAdministeredVaccine = await models.AdministeredVaccine.create(
          fake(models.AdministeredVaccine, {
            encounterId: nonSensitiveEncounter.id,
            scheduledVaccineId: (
              await models.ScheduledVaccine.create(fake(models.ScheduledVaccine))
            ).id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.AdministeredVaccine,
          sensitiveId: sensitiveAdministeredVaccine.id,
          nonSensitiveId: nonSensitiveAdministeredVaccine.id,
        });
      });

      it("won't sync sensitive encounter appointments", async () => {
        const sensitiveAppointment = await models.Appointment.create(
          fake(models.Appointment, {
            patientId: patient.id,
            locationId: sensitiveEncounter.locationId,
          }),
        );
        const nonSensitiveAppointment = await models.Appointment.create(
          fake(models.Appointment, {
            patientId: patient.id,
            locationId: nonSensitiveEncounter.locationId,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.Appointment,
          sensitiveId: sensitiveAppointment.id,
          nonSensitiveId: nonSensitiveAppointment.id,
        });
      });

      it("won't sync sensitive encounter document metadata", async () => {
        const sensitiveDocumentMetadata = await models.DocumentMetadata.create(
          fake(models.DocumentMetadata, {
            encounterId: sensitiveEncounter.id,
          }),
        );
        const nonSensitiveDocumentMetadata = await models.DocumentMetadata.create(
          fake(models.DocumentMetadata, {
            encounterId: nonSensitiveEncounter.id,
          }),
        );
        await checkSensitiveRecordFiltering({
          model: models.DocumentMetadata,
          sensitiveId: sensitiveDocumentMetadata.id,
          nonSensitiveId: nonSensitiveDocumentMetadata.id,
        });
      });

      describe('Program/Survey clinical data', () => {
        let sensitiveSurveyResponse;
        let nonSensitiveSurveyResponse;
        let sensitiveSurveyResponseAnswer;
        let nonSensitiveSurveyResponseAnswer;

        beforeEach(async () => {
          sensitiveSurveyResponse = await models.SurveyResponse.create(
            fake(models.SurveyResponse, {
              encounterId: sensitiveEncounter.id,
            }),
          );
          nonSensitiveSurveyResponse = await models.SurveyResponse.create(
            fake(models.SurveyResponse, {
              encounterId: nonSensitiveEncounter.id,
            }),
          );

          sensitiveSurveyResponseAnswer = await models.SurveyResponseAnswer.create(
            fake(models.SurveyResponseAnswer, {
              responseId: sensitiveSurveyResponse.id,
            }),
          );
          nonSensitiveSurveyResponseAnswer = await models.SurveyResponseAnswer.create(
            fake(models.SurveyResponseAnswer, {
              responseId: nonSensitiveSurveyResponse.id,
            }),
          );
        });

        it("won't sync sensitive encounter survey responses", async () => {
          await checkSensitiveRecordFiltering({
            model: models.SurveyResponse,
            sensitiveId: sensitiveSurveyResponse.id,
            nonSensitiveId: nonSensitiveSurveyResponse.id,
          });
        });

        it("won't sync sensitive encounter survey response answers", async () => {
          await checkSensitiveRecordFiltering({
            model: models.SurveyResponseAnswer,
            sensitiveId: sensitiveSurveyResponseAnswer.id,
            nonSensitiveId: nonSensitiveSurveyResponseAnswer.id,
          });
        });

        it("won't sync sensitive encounter referrals", async () => {
          const sensitiveReferral = await models.Referral.create(
            fake(models.Referral, {
              initiatingEncounterId: sensitiveEncounter.id,
            }),
          );
          const nonSensitiveReferral = await models.Referral.create(
            fake(models.Referral, {
              initiatingEncounterId: nonSensitiveEncounter.id,
            }),
          );
          await checkSensitiveRecordFiltering({
            model: models.Referral,
            sensitiveId: sensitiveReferral.id,
            nonSensitiveId: nonSensitiveReferral.id,
          });
        });

        it("won't sync sensitive encounter vital logs", async () => {
          const sensitiveVitalLog = await models.VitalLog.create(
            fake(models.VitalLog, {
              answerId: sensitiveSurveyResponseAnswer.id,
            }),
          );
          const nonSensitiveVitalLog = await models.VitalLog.create(
            fake(models.VitalLog, {
              answerId: nonSensitiveSurveyResponseAnswer.id,
            }),
          );
          await checkSensitiveRecordFiltering({
            model: models.VitalLog,
            sensitiveId: sensitiveVitalLog.id,
            nonSensitiveId: nonSensitiveVitalLog.id,
          });
        });
      });

      describe('Imaging clinical data', () => {
        let sensitiveImagingRequest;
        let nonSensitiveImagingRequest;

        beforeEach(async () => {
          sensitiveImagingRequest = await models.ImagingRequest.create(
            fake(models.ImagingRequest, {
              encounterId: sensitiveEncounter.id,
              requestedById: practitioner.id,
            }),
          );
          nonSensitiveImagingRequest = await models.ImagingRequest.create(
            fake(models.ImagingRequest, {
              encounterId: nonSensitiveEncounter.id,
              requestedById: practitioner.id,
            }),
          );
        });

        it("won't sync sensitive encounter imaging requests", async () => {
          await checkSensitiveRecordFiltering({
            model: models.ImagingRequest,
            sensitiveId: sensitiveImagingRequest.id,
            nonSensitiveId: nonSensitiveImagingRequest.id,
          });
        });
        it("won't sync sensitive encounter imaging results", async () => {
          const sensitiveImagingResult = await models.ImagingResult.create(
            fake(models.ImagingResult, {
              imagingRequestId: sensitiveImagingRequest.id,
            }),
          );
          const nonSensitiveImagingResult = await models.ImagingResult.create(
            fake(models.ImagingResult, {
              imagingRequestId: nonSensitiveImagingRequest.id,
            }),
          );
          await checkSensitiveRecordFiltering({
            model: models.ImagingResult,
            sensitiveId: sensitiveImagingResult.id,
            nonSensitiveId: nonSensitiveImagingResult.id,
          });
        });
        it("won't sync sensitive encounter imaging request areas", async () => {
          const sensitiveImagingRequestArea = await models.ImagingRequestArea.create(
            fake(models.ImagingRequestArea, {
              imagingRequestId: sensitiveImagingRequest.id,
              areaId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
            }),
          );
          const nonSensitiveImagingRequestArea = await models.ImagingRequestArea.create(
            fake(models.ImagingRequestArea, {
              imagingRequestId: nonSensitiveImagingRequest.id,
              areaId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
            }),
          );
          await checkSensitiveRecordFiltering({
            model: models.ImagingRequestArea,
            sensitiveId: sensitiveImagingRequestArea.id,
            nonSensitiveId: nonSensitiveImagingRequestArea.id,
          });
        });
      });

      describe('Medication clinical data', () => {
        let sensitivePrescription;
        let nonSensitivePrescription;
        let sensitiveEncounterPrescription;
        let nonSensitiveEncounterPrescription;
        let sensitiveMedicationAdministrationRecord;
        let nonSensitiveMedicationAdministrationRecord;

        beforeEach(async () => {
          sensitivePrescription = await models.Prescription.create(fake(models.Prescription));
          nonSensitivePrescription = await models.Prescription.create(fake(models.Prescription));
          sensitiveEncounterPrescription = await models.EncounterPrescription.create(
            fake(models.EncounterPrescription, {
              encounterId: sensitiveEncounter.id,
              prescriptionId: sensitivePrescription.id,
            }),
          );
          nonSensitiveEncounterPrescription = await models.EncounterPrescription.create(
            fake(models.EncounterPrescription, {
              encounterId: nonSensitiveEncounter.id,
              prescriptionId: nonSensitivePrescription.id,
            }),
          );

          sensitiveMedicationAdministrationRecord =
            await models.MedicationAdministrationRecord.create(
              fake(models.MedicationAdministrationRecord, {
                prescriptionId: sensitivePrescription.id,
              }),
            );

          nonSensitiveMedicationAdministrationRecord =
            await models.MedicationAdministrationRecord.create(
              fake(models.MedicationAdministrationRecord, {
                prescriptionId: nonSensitivePrescription.id,
              }),
            );
        });

        it("won't sync sensitive prescriptions", async () => {
          await checkSensitiveRecordFiltering({
            model: models.Prescription,
            sensitiveId: sensitivePrescription.id,
            nonSensitiveId: nonSensitivePrescription.id,
          });
        });

        it("won't sync sensitive encounter prescriptions", async () => {
          await checkSensitiveRecordFiltering({
            model: models.EncounterPrescription,
            sensitiveId: sensitiveEncounterPrescription.id,
            nonSensitiveId: nonSensitiveEncounterPrescription.id,
          });
        });

        it("won't sync sensitive encounter pause prescriptions", async () => {
          const sensitiveEncounterPausePrescription =
            await models.EncounterPausePrescription.create(
              fake(models.EncounterPausePrescription, {
                encounterPrescriptionId: sensitiveEncounterPrescription.id,
              }),
            );
          const nonSensitiveEncounterPausePrescription =
            await models.EncounterPausePrescription.create(
              fake(models.EncounterPausePrescription, {
                encounterPrescriptionId: nonSensitiveEncounterPrescription.id,
              }),
            );

          const sensitiveEncounterPausePrescriptionHistory =
            await models.EncounterPausePrescriptionHistory.findOne({
              where: {
                encounterPrescriptionId: sensitiveEncounterPrescription.id,
              },
            });
          const nonSensitiveEncounterPausePrescriptionHistory =
            await models.EncounterPausePrescriptionHistory.findOne({
              where: {
                encounterPrescriptionId: nonSensitiveEncounterPrescription.id,
              },
            });

          await checkSensitiveRecordFiltering({
            model: models.EncounterPausePrescription,
            sensitiveId: sensitiveEncounterPausePrescription.id,
            nonSensitiveId: nonSensitiveEncounterPausePrescription.id,
          });

          await checkSensitiveRecordFiltering({
            model: models.EncounterPausePrescriptionHistory,
            sensitiveId: sensitiveEncounterPausePrescriptionHistory.id,
            nonSensitiveId: nonSensitiveEncounterPausePrescriptionHistory.id,
          });
        });

        it("won't sync sensitive medication administration records", async () => {
          await checkSensitiveRecordFiltering({
            model: models.MedicationAdministrationRecord,
            sensitiveId: sensitiveMedicationAdministrationRecord.id,
            nonSensitiveId: nonSensitiveMedicationAdministrationRecord.id,
          });
        });

        it("won't sync sensitive medication administration record doses", async () => {
          const sensitiveMedicationAdministrationRecordDose =
            await models.MedicationAdministrationRecordDose.create(
              fake(models.MedicationAdministrationRecordDose, {
                marId: sensitiveMedicationAdministrationRecord.id,
                recordedByUserId: practitioner.id,
                givenByUserId: practitioner.id,
              }),
            );
          const nonSensitiveMedicationAdministrationRecordDose =
            await models.MedicationAdministrationRecordDose.create(
              fake(models.MedicationAdministrationRecordDose, {
                marId: nonSensitiveMedicationAdministrationRecord.id,
                recordedByUserId: practitioner.id,
                givenByUserId: practitioner.id,
              }),
            );

          await checkSensitiveRecordFiltering({
            model: models.MedicationAdministrationRecordDose,
            sensitiveId: sensitiveMedicationAdministrationRecordDose.id,
            nonSensitiveId: nonSensitiveMedicationAdministrationRecordDose.id,
          });
        });
      });

      describe('Invoice clinical data', () => {
        let sensitiveInvoice;
        let nonSensitiveInvoice;
        let sensitiveInvoiceItem;
        let nonSensitiveInvoiceItem;

        beforeEach(async () => {
          sensitiveInvoice = await models.Invoice.create(
            fake(models.Invoice, {
              encounterId: sensitiveEncounter.id,
            }),
          );
          nonSensitiveInvoice = await models.Invoice.create(
            fake(models.Invoice, {
              encounterId: nonSensitiveEncounter.id,
            }),
          );
          sensitiveInvoiceItem = await models.InvoiceItem.create(
            fake(models.InvoiceItem, {
              invoiceId: sensitiveInvoice.id,
              orderedByUserId: practitioner.id,
            }),
          );
          nonSensitiveInvoiceItem = await models.InvoiceItem.create(
            fake(models.InvoiceItem, {
              invoiceId: nonSensitiveInvoice.id,
              orderedByUserId: practitioner.id,
            }),
          );
        });

        it("won't sync sensitive encounter invoice", async () => {
          await checkSensitiveRecordFiltering({
            model: models.Invoice,
            sensitiveId: sensitiveInvoice.id,
            nonSensitiveId: nonSensitiveInvoice.id,
          });
        });

        it("won't sync sensitive encounter invoice items", async () => {
          await checkSensitiveRecordFiltering({
            model: models.InvoiceItem,
            sensitiveId: sensitiveInvoiceItem.id,
            nonSensitiveId: nonSensitiveInvoiceItem.id,
          });
        });

        it("won't sync sensitive encounter invoice payments", async () => {
          const sensitiveInvoicePayment = await models.InvoicePayment.create(
            fake(models.InvoicePayment, {
              invoiceId: sensitiveInvoice.id,
            }),
          );
          const nonSensitiveInvoicePayment = await models.InvoicePayment.create(
            fake(models.InvoicePayment, {
              invoiceId: nonSensitiveInvoice.id,
            }),
          );
          await checkSensitiveRecordFiltering({
            model: models.InvoicePayment,
            sensitiveId: sensitiveInvoicePayment.id,
            nonSensitiveId: nonSensitiveInvoicePayment.id,
          });
        });

        it("won't sync sensitive encounter invoice insurer payments", async () => {
          const sensitiveInvoicePayment = await models.InvoicePayment.create(
            fake(models.InvoicePayment, {
              invoiceId: sensitiveInvoice.id,
            }),
          );
          const nonSensitiveInvoicePayment = await models.InvoicePayment.create(
            fake(models.InvoicePayment, {
              invoiceId: nonSensitiveInvoice.id,
            }),
          );

          const sensitiveInsurerPayment = await models.InvoiceInsurerPayment.create(
            fake(models.InvoiceInsurerPayment, {
              invoicePaymentId: sensitiveInvoicePayment.id,
            }),
          );
          const nonSensitiveInsurerPayment = await models.InvoiceInsurerPayment.create(
            fake(models.InvoiceInsurerPayment, {
              invoicePaymentId: nonSensitiveInvoicePayment.id,
            }),
          );

          await checkSensitiveRecordFiltering({
            model: models.InvoiceInsurerPayment,
            sensitiveId: sensitiveInsurerPayment.id,
            nonSensitiveId: nonSensitiveInsurerPayment.id,
          });
        });

        it("won't sync sensitive encounter invoice patient payments", async () => {
          const sensitiveInvoicePayment = await models.InvoicePayment.create(
            fake(models.InvoicePayment, {
              invoiceId: sensitiveInvoice.id,
            }),
          );
          const nonSensitiveInvoicePayment = await models.InvoicePayment.create(
            fake(models.InvoicePayment, {
              invoiceId: nonSensitiveInvoice.id,
            }),
          );

          const sensitivePatientPayment = await models.InvoicePatientPayment.create(
            fake(models.InvoicePatientPayment, {
              invoicePaymentId: sensitiveInvoicePayment.id,
            }),
          );
          const nonSensitivePatientPayment = await models.InvoicePatientPayment.create(
            fake(models.InvoicePatientPayment, {
              invoicePaymentId: nonSensitiveInvoicePayment.id,
            }),
          );

          await checkSensitiveRecordFiltering({
            model: models.InvoicePatientPayment,
            sensitiveId: sensitivePatientPayment.id,
            nonSensitiveId: nonSensitivePatientPayment.id,
          });
        });

        it("won't sync sensitive encounter invoice item discounts", async () => {
          const sensitiveItemDiscount = await models.InvoiceItemDiscount.create(
            fake(models.InvoiceItemDiscount, {
              invoiceItemId: sensitiveInvoiceItem.id,
            }),
          );
          const nonSensitiveItemDiscount = await models.InvoiceItemDiscount.create(
            fake(models.InvoiceItemDiscount, {
              invoiceItemId: nonSensitiveInvoiceItem.id,
            }),
          );

          await checkSensitiveRecordFiltering({
            model: models.InvoiceItemDiscount,
            sensitiveId: sensitiveItemDiscount.id,
            nonSensitiveId: nonSensitiveItemDiscount.id,
          });
        });

        it("won't sync sensitive encounter invoice discounts", async () => {
          const sensitiveInvoiceDiscount = await models.InvoiceDiscount.create(
            fake(models.InvoiceDiscount, {
              invoiceId: sensitiveInvoice.id,
              appliedByUserId: practitioner.id,
            }),
          );
          const nonSensitiveInvoiceDiscount = await models.InvoiceDiscount.create(
            fake(models.InvoiceDiscount, {
              invoiceId: nonSensitiveInvoice.id,
              appliedByUserId: practitioner.id,
            }),
          );

          await checkSensitiveRecordFiltering({
            model: models.InvoiceDiscount,
            sensitiveId: sensitiveInvoiceDiscount.id,
            nonSensitiveId: nonSensitiveInvoiceDiscount.id,
          });
        });

        it("won't sync sensitive encounter invoice insurers", async () => {
          const sensitiveInvoiceInsurer = await models.InvoiceInsurer.create(
            fake(models.InvoiceInsurer, {
              invoiceId: sensitiveInvoice.id,
              insurerId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
            }),
          );
          const nonSensitiveInvoiceInsurer = await models.InvoiceInsurer.create(
            fake(models.InvoiceInsurer, {
              invoiceId: nonSensitiveInvoice.id,
              insurerId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
            }),
          );

          await checkSensitiveRecordFiltering({
            model: models.InvoiceInsurer,
            sensitiveId: sensitiveInvoiceInsurer.id,
            nonSensitiveId: nonSensitiveInvoiceInsurer.id,
          });
        });
      });

      describe('Lab clinical data', () => {
        let sensitiveLabRequest;
        let nonSensitiveLabRequest;

        beforeEach(async () => {
          sensitiveLabRequest = await models.LabRequest.create(
            fake(models.LabRequest, {
              encounterId: sensitiveEncounter.id,
            }),
          );
          nonSensitiveLabRequest = await models.LabRequest.create(
            fake(models.LabRequest, {
              encounterId: nonSensitiveEncounter.id,
            }),
          );
        });

        it("won't sync sensitive encounter lab requests", async () => {
          await checkSensitiveRecordFiltering({
            model: models.LabRequest,
            sensitiveId: sensitiveLabRequest.id,
            nonSensitiveId: nonSensitiveLabRequest.id,
          });
        });

        it("won't sync sensitive encounter lab tests", async () => {
          const sensitiveLabTest = await models.LabTest.create(
            fake(models.LabTest, {
              labRequestId: sensitiveLabRequest.id,
            }),
          );
          const nonSensitiveLabTest = await models.LabTest.create(
            fake(models.LabTest, {
              labRequestId: nonSensitiveLabRequest.id,
            }),
          );

          await checkSensitiveRecordFiltering({
            model: models.LabTest,
            sensitiveId: sensitiveLabTest.id,
            nonSensitiveId: nonSensitiveLabTest.id,
          });
        });

        it("won't sync sensitive encounter lab request attachments", async () => {
          const sensitiveLabRequestAttachment = await models.LabRequestAttachment.create(
            fake(models.LabRequestAttachment, {
              labRequestId: sensitiveLabRequest.id,
            }),
          );
          const nonSensitiveLabRequestAttachment = await models.LabRequestAttachment.create(
            fake(models.LabRequestAttachment, {
              labRequestId: nonSensitiveLabRequest.id,
            }),
          );
          await checkSensitiveRecordFiltering({
            model: models.LabRequestAttachment,
            sensitiveId: sensitiveLabRequestAttachment.id,
            nonSensitiveId: nonSensitiveLabRequestAttachment.id,
          });
        });

        it("won't sync sensitive encounter lab test panel requests", async () => {
          const sensitiveLabTestPanelRequest = await models.LabTestPanelRequest.create(
            fake(models.LabTestPanelRequest, {
              encounterId: sensitiveEncounter.id,
              labTestPanelId: (await models.LabTestPanel.create(fake(models.LabTestPanel))).id,
            }),
          );
          const nonSensitiveLabTestPanelRequest = await models.LabTestPanelRequest.create(
            fake(models.LabTestPanelRequest, {
              encounterId: nonSensitiveEncounter.id,
              labTestPanelId: (await models.LabTestPanel.create(fake(models.LabTestPanel))).id,
            }),
          );
          await checkSensitiveRecordFiltering({
            model: models.LabTestPanelRequest,
            sensitiveId: sensitiveLabTestPanelRequest.id,
            nonSensitiveId: nonSensitiveLabTestPanelRequest.id,
          });
        });

        it("won't sync sensitive encounter lab request logs", async () => {
          const sensitiveLabRequestLog = await models.LabRequestLog.create(
            fake(models.LabRequestLog, {
              labRequestId: sensitiveLabRequest.id,
            }),
          );
          const nonSensitiveLabRequestLog = await models.LabRequestLog.create(
            fake(models.LabRequestLog, {
              labRequestId: nonSensitiveLabRequest.id,
            }),
          );
          await checkSensitiveRecordFiltering({
            model: models.LabRequestLog,
            sensitiveId: sensitiveLabRequestLog.id,
            nonSensitiveId: nonSensitiveLabRequestLog.id,
          });
        });

        it('will sync sensitive lab requests to any facility with syncAllLabRequests enabled', async () => {
          await models.Setting.create({
            facilityId: nonSensitiveFacility.id,
            key: 'sync.syncAllLabRequests',
            value: true,
            scope: SETTINGS_SCOPES.FACILITY,
          });

          const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
          await centralSyncManager.updateLookupTable();

          const labRequestIds = await getOutgoingIdsForRecordType(
            centralSyncManager,
            sensitiveFacility.id,
            models.LabRequest.tableName,
          );
          expect(labRequestIds).toContain(sensitiveLabRequest.id);
          expect(labRequestIds).toContain(nonSensitiveLabRequest.id);
        });
      });
    });

    describe('edge cases', () => {
      it("won't sync between facilities just because they are both sensitive", async () => {
        const sensitiveFacilityA = await models.Facility.create(
          fake(models.Facility, {
            isSensitive: true,
          }),
        );
        const sensitiveFacilityB = await models.Facility.create(
          fake(models.Facility, {
            isSensitive: true,
          }),
        );
        const sensitiveLocationA = await models.Location.create(
          fake(models.Location, {
            facilityId: sensitiveFacilityA.id,
          }),
        );
        const sensitiveDepartmentA = await models.Department.create(
          fake(models.Department, {
            facilityId: sensitiveFacilityA.id,
          }),
        );
        const sensitiveLocationB = await models.Location.create(
          fake(models.Location, {
            facilityId: sensitiveFacilityB.id,
          }),
        );
        const sensitiveDepartmentB = await models.Department.create(
          fake(models.Department, {
            facilityId: sensitiveFacilityB.id,
          }),
        );
        const sensitiveEncounterA = await models.Encounter.create({
          ...fake(models.Encounter),
          patientId: patient.id,
          locationId: sensitiveLocationA.id,
          departmentId: sensitiveDepartmentA.id,
          examinerId: practitioner.id,
          endDate: null,
        });
        const sensitiveEncounterB = await models.Encounter.create({
          ...fake(models.Encounter),
          patientId: patient.id,
          locationId: sensitiveLocationB.id,
          departmentId: sensitiveDepartmentB.id,
          examinerId: practitioner.id,
          endDate: null,
        });

        const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
        await centralSyncManager.updateLookupTable();

        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 1,
            facilityIds: [sensitiveFacilityA.id],
          },
          () => true,
        );

        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
        const encounterIds = outgoingChanges
          .filter(c => c.recordType === 'encounters')
          .map(c => c.recordId);

        expect(encounterIds).toContain(sensitiveEncounterA.id);
        expect(encounterIds).not.toContain(sensitiveEncounterB.id);
      });

      it('will keep historical sensitive data unsynced to other facilities when a facility changes from sensitive to non-sensitive, until the data is edited', async () => {
        // Create a facility that starts as sensitive
        const facility = await models.Facility.create(fake(models.Facility, { isSensitive: true }));
        const department = await models.Department.create(
          fake(models.Department, { facilityId: facility.id }),
        );
        const location = await models.Location.create(
          fake(models.Location, { facilityId: facility.id }),
        );

        // Create encounter while facility is sensitive
        const encounter = await models.Encounter.create({
          ...fake(models.Encounter),
          patientId: patient.id,
          locationId: location.id,
          departmentId: department.id,
          examinerId: practitioner.id,
          endDate: null,
        });

        // Initialize sync manager and update lookup table to capture the sensitive state
        const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
        await centralSyncManager.updateLookupTable();

        // Change facility to non-sensitive and update lookup table
        await facility.update({ isSensitive: false });
        await centralSyncManager.updateLookupTable();

        // Check that the historical sensitive data is still unsynced to the non-sensitive facility
        const beforeEditEncounterIds = await getOutgoingIdsForRecordType(
          centralSyncManager,
          nonSensitiveFacility.id,
          'encounters',
        );
        expect(beforeEditEncounterIds).not.toContain(encounter.id);

        // Edit the encounter to trigger a new sync
        await encounter.update({ reasonForEncounter: 'Updated reason for encounter' });
        await centralSyncManager.updateLookupTable();

        // Check that the new encounter changes are synced to the non-sensitive facility
        const updatedEncounterIds = await getOutgoingIdsForRecordType(
          centralSyncManager,
          nonSensitiveFacility.id,
          'encounters',
        );
        expect(updatedEncounterIds).toContain(encounter.id);
      });

      it('will keep historical non-sensitive data synced to other facilities when a facility changes to sensitive, but stop syncing new changes', async () => {
        // Create a facility that starts as non-sensitive
        const facility = await models.Facility.create(
          fake(models.Facility, { isSensitive: false }),
        );
        const department = await models.Department.create(
          fake(models.Department, { facilityId: facility.id }),
        );
        const location = await models.Location.create(
          fake(models.Location, { facilityId: facility.id }),
        );

        // Create encounter while facility is non-sensitive
        const encounter = await models.Encounter.create({
          ...fake(models.Encounter),
          patientId: patient.id,
          locationId: location.id,
          departmentId: department.id,
          examinerId: practitioner.id,
          endDate: null,
        });

        // Initialize sync manager and update lookup table to capture the non-sensitive state
        const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
        await centralSyncManager.updateLookupTable();

        // Change facility to sensitive and update lookup table
        await facility.update({ isSensitive: true });
        await centralSyncManager.updateLookupTable();

        // Check that the historical non-sensitive data is still synced to the non-sensitive facility
        const beforeEditEncounterIds = await getOutgoingIdsForRecordType(
          centralSyncManager,
          nonSensitiveFacility.id,
          'encounters',
        );
        expect(beforeEditEncounterIds).toContain(encounter.id);

        // Edit the encounter to trigger a new sync
        await encounter.update({ reasonForEncounter: 'Updated reason for encounter' });
        await centralSyncManager.updateLookupTable();

        // Check that the new encounter changes are not synced to the non-sensitive facility
        const updatedEncounterIds = await getOutgoingIdsForRecordType(
          centralSyncManager,
          nonSensitiveFacility.id,
          'encounters',
        );
        expect(updatedEncounterIds).not.toContain(encounter.id);
      });

      it('will sync prescriptions linked through patient_ongoing_prescriptions if marked for sync', async () => {
        const testPatient1 = await models.Patient.create(fake(models.Patient));
        const testPatient2 = await models.Patient.create(fake(models.Patient));

        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: testPatient1.id,
          facilityId: nonSensitiveFacility.id,
        });
        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: testPatient2.id,
          facilityId: nonSensitiveFacility.id,
        });

        // Create prescriptions that are only linked through patient_ongoing_prescriptions (no encounters)
        const patientOnlyPrescription = await models.Prescription.create(fake(models.Prescription));
        const patientOnlyPrescription2 = await models.Prescription.create(
          fake(models.Prescription),
        );

        await models.PatientOngoingPrescription.create(
          fake(models.PatientOngoingPrescription, {
            patientId: testPatient1.id,
            prescriptionId: patientOnlyPrescription.id,
          }),
        );
        await models.PatientOngoingPrescription.create(
          fake(models.PatientOngoingPrescription, {
            patientId: testPatient2.id,
            prescriptionId: patientOnlyPrescription2.id,
          }),
        );

        const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
        await centralSyncManager.updateLookupTable();

        // Check that both prescriptions are in the lookup table
        const recordIds = await getOutgoingIdsForRecordType(
          centralSyncManager,
          nonSensitiveFacility.id,
          models.Prescription.tableName,
        );

        expect(recordIds).toContain(patientOnlyPrescription.id);
        expect(recordIds).toContain(patientOnlyPrescription2.id);
      });
    });
  });
});
