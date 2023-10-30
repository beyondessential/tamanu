import { sub, endOfDay, parseISO } from 'date-fns';
import { v4 as uuid } from 'uuid';


import { CURRENT_SYNC_TIME_KEY } from '@tamanu/shared/sync/constants';
import { SYNC_SESSION_DIRECTION } from '@tamanu/shared/sync';
import { fake, fakeUser, fakeSurvey, fakeReferenceData } from '@tamanu/shared/test-helpers/fake';
import { createDummyEncounter, createDummyPatient } from '@tamanu/shared/demoData/patients';
import { randomLabRequest } from '@tamanu/shared/demoData';
import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';
import { SYNC_DIRECTIONS, LAB_REQUEST_STATUSES,SETTINGS_SCOPES } from '@tamanu/constants';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { createTestContext } from '../utilities';
import { importerTransaction } from '../../app/admin/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';

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

  const initializeCentralSyncManager = () => {
    // Have to load test function within test scope so that we can mock dependencies per test case
    const {
      CentralSyncManager: TestCentralSyncManager,
    } = require('../../app/sync/CentralSyncManager');
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

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, DEFAULT_CURRENT_SYNC_TIME_VALUE);
    await models.Facility.truncate({ cascade: true, force: true });
    await models.Program.truncate({ cascade: true, force: true });
    await models.Survey.truncate({ cascade: true, force: true });
    await models.ProgramDataElement.truncate({ cascade: true, force: true });
    await models.SurveyScreenComponent.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
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
        where: { key: CURRENT_SYNC_TIME_KEY },
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
      session.error =
        'Snapshot processing incomplete, likely because the central server restarted during the snapshot';
      await session.save();

      expect(centralSyncManager.connectToSession(sessionId)).rejects.toThrow(
        `Sync session '${sessionId}' encountered an error: Snapshot processing incomplete, likely because the central server restarted during the snapshot`,
      );
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
          facilityId: facility.id,
        },
        () => true,
      );

      const changes = await centralSyncManager.getOutgoingChanges(sessionId, {
        limit: 10,
      });
      expect(changes.length).toBe(1);
    });
  });

  describe('setupSnapshotForPull', () => {
    describe('handles snapshot process', () => {
      it('returns all encounters for newly marked-for-sync patients', async () => {
        const OLD_SYNC_TICK = 10;
        const NEW_SYNC_TICK = 20;

        // ~ ~ ~ Set up old data
        await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, OLD_SYNC_TICK);
        const patient1 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const patient2 = await models.Patient.create({
          ...fake(models.Patient),
        });
        const patient3 = await models.Patient.create({
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

        await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, NEW_SYNC_TICK);

        // ~ ~ ~ Set up data for marked for sync patients
        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: patient1.id,
          facilityId: facility.id,
        });
        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: patient2.id,
          facilityId: facility.id,
        });

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 15,
            facilityId: facility.id,
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

      it('returns only newly created encounter for a previously marked-for-sync patient', async () => {
        const OLD_SYNC_TICK = 10;
        const NEW_SYNC_TICK = 20;

        // ~ ~ ~ Set up old data
        await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, OLD_SYNC_TICK);
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
        // ~ ~ ~ Set up data for marked for sync patients
        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: patient1.id,
          facilityId: facility.id,
        });

        await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, NEW_SYNC_TICK);

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
            facilityId: facility.id,
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

      it('filters settings to be synced by sync tick', async () => {
        await models.Setting.truncate({ cascade: true, force: true });
        const generateSetting = async (scope, facilityId = null) => {
          const setting = await models.Setting.create({
            ...fake(models.Setting),
            scope,
            facilityId,
            deletedAt: null,
          });
          return setting;
        };

        const facility1 = await models.Facility.create({
          ...fake(models.Facility),
        });

        await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, 10);

        await generateSetting(SETTINGS_SCOPES.GLOBAL);
        await generateSetting(SETTINGS_SCOPES.GLOBAL);

        await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, 20);

        const newSetting1 = await generateSetting(SETTINGS_SCOPES.GLOBAL);
        const newSetting2 = await generateSetting(SETTINGS_SCOPES.GLOBAL);

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 15,
            facilityId: facility1.id,
          },
          () => true,
        );

        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});

        expect(outgoingChanges.map(c => c.recordId).sort()).toEqual(
          [newSetting1.id, newSetting2.id].sort(),
        );
      });

      it('only sends "global" and "facility" settings to relevant facilities', async () => {
        await models.Setting.truncate({ cascade: true, force: true });
        const generateSetting = async (scope, facilityId = null) => {
          const setting = await models.Setting.create({
            ...fake(models.Setting),
            scope,
            facilityId,
            deletedAt: null,
          });
          return setting;
        };

        const facility1 = await models.Facility.create({
          ...fake(models.Facility),
        });
        const facility2 = await models.Facility.create({
          ...fake(models.Facility),
        });

        await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, 10);

        await generateSetting(SETTINGS_SCOPES.CENTRAL);
        const globalSetting = await generateSetting(SETTINGS_SCOPES.GLOBAL);
        const facility1Setting = await generateSetting(SETTINGS_SCOPES.FACILITY, facility1.id);
        await generateSetting(SETTINGS_SCOPES.FACILITY, facility2.id);

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 5, // after the facilities were created, but before all of the settings were
            facilityId: facility1.id,
          },
          () => true,
        );

        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});

        expect(outgoingChanges.map(c => c.recordId).sort()).toEqual(
          [globalSetting.id, facility1Setting.id].sort(),
        );
      });
    });

    describe('handles concurrent transactions', () => {
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
        let resolveSnapshotOutgoingChangesWaitingPromise;
        const snapshotOutgoingChangesWaitingPromise = new Promise(resolve => {
          resolveSnapshotOutgoingChangesWaitingPromise = async () => resolve(true);
        });

        // Build the fakeModelPromise so that it can block the snapshotting process,
        // then we can insert some new records while snapshotting is happening
        let resolveMockedModelSnapshotOutgoingChangesQueryPromise;
        const mockedModelSnapshotOutgoingChangesQueryPromise = new Promise(resolve => {
          // count: 100 is not correct but shouldn't matter in this test case
          resolveMockedModelSnapshotOutgoingChangesQueryPromise = async () =>
            resolve([[{ maxId: null, count: 100 }]]);
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
              await resolveSnapshotOutgoingChangesWaitingPromise();
              return mockedModelSnapshotOutgoingChangesQueryPromise;
            },
          },
          buildSyncFilter: () => null,
        };

        return {
          MockedPullOnlyModel,
          resolveMockedModelSnapshotOutgoingChangesQueryPromise,
          snapshotOutgoingChangesWaitingPromise,
        };
      };

      afterEach(async () => {
        // Revert to the original models
        ctx.store.models = models;
      });

      it('excludes manually inserted records when main snapshot transaction already started', async () => {
        const [facility, program, survey] = await prepareRecordsForSync();

        // Build the fakeModelPromise so that it can block the snapshotting process,
        // then we can insert some new records while snapshotting is happening
        const {
          resolveMockedModelSnapshotOutgoingChangesQueryPromise,
          snapshotOutgoingChangesWaitingPromise,
          MockedPullOnlyModel,
        } = await prepareMockedPullOnlyModelQueryPromise();

        // Initialize CentralSyncManager with MockedPullOnlyModel
        ctx.store.models = {
          MockedPullOnlyModel,
          ...models,
        };

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        // Start the snapshot process
        const snapshot = centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 1,
            facilityId: facility.id,
            isMobile: true,
          },
          () => true,
        );

        // wait until setupSnapshotForPull() reaches snapshotting for MockedModel
        // and block the snapshotting process inside the wrapper transaction,
        await snapshotOutgoingChangesWaitingPromise;

        // Insert the records just before we release the lock,
        // meaning that we're inserting the records below in the middle of the snapshotting process,
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
        await resolveMockedModelSnapshotOutgoingChangesQueryPromise();
        await sleepAsync(20);

        await snapshot;

        // Check if only 3 pre inserted records were snapshotted
        // and not the ones that were inserted in the middle of the snapshot process
        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
        expect(outgoingChanges.length).toBe(3);
        expect(outgoingChanges.map(r => r.recordId).sort()).toEqual(
          [facility, program, survey].map(r => r.id).sort(),
        );

        // Revert the models
        ctx.store.models = models;
      });

      it('excludes imported records when main snapshot transaction already started', async () => {
        const [facility, program, survey] = await prepareRecordsForSync();
        // Build the fakeModelPromise so that it can block the snapshotting process,
        // then we can insert some new records while snapshotting is happening
        const {
          resolveMockedModelSnapshotOutgoingChangesQueryPromise,
          snapshotOutgoingChangesWaitingPromise,
          MockedPullOnlyModel,
        } = await prepareMockedPullOnlyModelQueryPromise();

        // Initialize CentralSyncManager with MockedPullOnlyModel
        ctx.store.models = {
          MockedPullOnlyModel,
          ...models,
        };

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionId);

        // Start the snapshot process
        const snapshot = centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: 1,
            facilityId: facility.id,
            isMobile: true,
          },
          () => true,
        );

        // wait until setupSnapshotForPull() reaches snapshotting for MockedModel
        // and block the snapshotting process inside the wrapper transaction
        await snapshotOutgoingChangesWaitingPromise;

        // Insert the records just before we release the lock,
        // meaning that we're inserting the records below in the middle of the snapshotting process,
        await doImport({ file: 'refdata-valid', dryRun: false }, models);

        // Now release the lock to see if the snapshot captures the newly inserted records above
        await resolveMockedModelSnapshotOutgoingChangesQueryPromise();
        await sleepAsync(20);

        await snapshot;

        // Check if only 3 pre inserted records were snapshotted
        // and not the ones that were inserted in the middle of the snapshot process
        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
        expect(outgoingChanges.length).toBe(3);
        expect(outgoingChanges.map(r => r.recordId).sort()).toEqual(
          [facility, program, survey].map(r => r.id).sort(),
        );
      });

      it('excludes inserted records from another sync session when snapshot transaction already started', async () => {
        const [facility, program, survey] = await prepareRecordsForSync();
        // Build the fakeModelPromise so that it can block the snapshotting process,
        // then we can insert some new records while snapshotting is happening
        const {
          resolveMockedModelSnapshotOutgoingChangesQueryPromise,
          snapshotOutgoingChangesWaitingPromise,
          MockedPullOnlyModel,
        } = await prepareMockedPullOnlyModelQueryPromise();

        // Initialize CentralSyncManager with MockedPullOnlyModel
        ctx.store.models = {
          MockedPullOnlyModel,
          ...models,
        };

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId: sessionIdOne } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionIdOne);

        // Start the snapshot process
        const snapshot = centralSyncManager.setupSnapshotForPull(
          sessionIdOne,
          {
            since: 1,
            facilityId: facility.id,
            isMobile: true,
          },
          () => true,
        );

        // wait until setupSnapshotForPull() reaches snapshotting for MockedModel
        // and block the snapshotting process inside the wrapper transaction
        await snapshotOutgoingChangesWaitingPromise;

        const survey1 = fakeSurvey();
        const survey2 = fakeSurvey();
        const survey3 = fakeSurvey();

        const changes = [
          {
            direction: SYNC_SESSION_DIRECTION.OUTGOING,
            isDeleted: false,
            recordType: 'surveys',
            recordId: survey1.id,
            data: survey1,
          },
          {
            direction: SYNC_SESSION_DIRECTION.OUTGOING,
            isDeleted: false,
            recordType: 'surveys',
            recordId: survey2.id,
            data: survey2,
          },
          {
            direction: SYNC_SESSION_DIRECTION.OUTGOING,
            isDeleted: false,
            recordType: 'surveys',
            recordId: survey3.id,
            data: survey2,
          },
        ];

        const { sessionId: sessionIdTwo } = await centralSyncManager.startSession();
        await waitForSession(centralSyncManager, sessionIdTwo);

        await centralSyncManager.addIncomingChanges(sessionIdTwo, changes);
        await centralSyncManager.completePush(sessionIdTwo);
        // Wait for persist of session 2 to complete
        await sleepAsync(100);

        // Now release the lock to see if the snapshot captures the newly inserted records above
        await resolveMockedModelSnapshotOutgoingChangesQueryPromise();
        await sleepAsync(20);

        await snapshot;

        // Check if only 3 pre inserted records were snapshotted
        // and not the ones that were inserted in the middle of the snapshot process
        const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionIdOne, {});

        expect(outgoingChanges.length).toBe(3);
        expect(outgoingChanges.map(r => r.recordId).sort()).toEqual(
          [facility, program, survey].map(r => r.id).sort(),
        );
      });
    });

    describe('handles sync special case configurations', () => {
      describe('syncAllLabRequests', () => {
        let facility;
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
          await models.User.truncate({ cascade: true, force: true });
          await models.Patient.truncate({ cascade: true, force: true });
          await models.Encounter.truncate({ cascade: true, force: true });
          await models.LabRequest.truncate({ cascade: true, force: true });

          // Create the lab requests to be tested
          facility = await models.Facility.create(fake(models.Facility));
          await models.User.create(fakeUser());
          await models.Department.create({
            ...fake(models.Department),
            facilityId: facility.id,
          });
          await models.Location.create({
            ...fake(models.Location),
            facilityId: facility.id,
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
          });
          encounter2 = await models.Encounter.create({
            ...(await createDummyEncounter(models)),
            patientId: patient2.id,
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
          });
          const fullSyncedPatientLabRequestData = await randomLabRequest(models, {
            patientId: fullSyncedPatientEncounter.id,
            encounterId: fullSyncedPatientEncounter.id,
            status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
          });
          fullSyncedPatientLabRequest = await models.LabRequest.create(
            fullSyncedPatientLabRequestData,
          );
          const fullSyncedPatientLabRequestTestsData = fullSyncedPatientLabRequestData.labTestTypeIds.map(
            labTestTypeId => ({
              ...fake(models.LabTest),
              labRequestId: fullSyncedPatientLabRequest.id,
              labTestTypeId,
            }),
          );
          fullSyncedPatientLabRequestTests = await Promise.all(
            fullSyncedPatientLabRequestTestsData.map(lt => models.LabTest.create(lt)),
          );
          await models.PatientFacility.create({
            id: models.PatientFacility.generateId(),
            patientId: fullSyncedPatient.id,
            facilityId: facility.id,
          });
        });

        it('syncs all lab requests when enabled', async () => {
          // Enable syncAllLabRequests
          await models.Setting.create({
            facilityId: facility.id,
            key: 'syncAllLabRequests',
            scope: SETTINGS_SCOPES.FACILITY,
            value: true,
          });

          const centralSyncManager = initializeCentralSyncManager();

          const { sessionId } = await centralSyncManager.startSession();
          await waitForSession(centralSyncManager, sessionId);

          await centralSyncManager.setupSnapshotForPull(
            sessionId,
            {
              since: 1,
              facilityId: facility.id,
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
            key: 'syncAllLabRequests',
            scope: SETTINGS_SCOPES.FACILITY,
            value: false,
          });

          const centralSyncManager = initializeCentralSyncManager();

          const { sessionId } = await centralSyncManager.startSession();
          await waitForSession(centralSyncManager, sessionId);

          await centralSyncManager.setupSnapshotForPull(
            sessionId,
            {
              since: 1,
              facilityId: facility.id,
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

      describe('syncAllEncountersForTheseVaccines', () => {
        let facility;
        let encounter1;
        let encounter2;
        let fullSyncedPatient;
        let administeredVaccine1;
        let administeredVaccine2;
        let fullSyncedAdministeredVaccine3;

        beforeEach(async () => {
          await models.Facility.truncate({ cascade: true, force: true });
          await models.Program.truncate({ cascade: true, force: true });
          await models.ReferenceData.truncate({ cascade: true, force: true });
          await models.Patient.truncate({ cascade: true, force: true });
          await models.User.truncate({ cascade: true, force: true });
          await models.Encounter.truncate({ cascade: true, force: true });
          await models.ScheduledVaccine.truncate({ cascade: true, force: true });
          await models.AdministeredVaccine.truncate({ cascade: true, force: true });

          facility = await models.Facility.create(fake(models.Facility));
          const [vaccineOne, vaccineTwo, vaccineThree] = await Promise.all([
            models.ReferenceData.create({
              ...fakeReferenceData(),
              id: 'drug-COVAX',
              code: 'COVAX',
              type: 'drug',
              name: 'COVAX',
            }),
            models.ReferenceData.create({
              ...fakeReferenceData(),
              id: 'drug-COVID-19-Pfizer',
              code: 'PFIZER',
              type: 'drug',
              name: 'PFIZER',
            }),
            models.ReferenceData.create({
              ...fakeReferenceData(),
              id: 'drug-test-2',
              code: 'test2',
              type: 'drug',
              name: 'Test 2',
            }),
          ]);
          const { id: patientId } = await models.Patient.create(fake(models.Patient));
          fullSyncedPatient = await models.Patient.create({
            ...fake(models.Patient),
          });
          const { id: examinerId } = await models.User.create(fakeUser());
          const { id: departmentId } = await models.Department.create({
            ...fake(models.Department),
            facilityId: facility.id,
          });
          const { id: locationId } = await models.Location.create({
            ...fake(models.Location),
            facilityId: facility.id,
          });

          encounter1 = await models.Encounter.create({
            ...fake(models.Encounter),
            departmentId,
            locationId,
            patientId,
            examinerId,
            endDate: null,
          });
          encounter2 = await models.Encounter.create({
            ...fake(models.Encounter),
            departmentId,
            locationId,
            patientId,
            examinerId,
            endDate: null,
          });
          const fullSyncedPatientEncounter = await models.Encounter.create({
            ...(await createDummyEncounter(models)),
            patientId: fullSyncedPatient.id,
          });
          const [scheduleOne, scheduleTwo, scheduleThree] = await Promise.all([
            models.ScheduledVaccine.create({
              ...fake(models.ScheduledVaccine),
              vaccineId: vaccineOne.id,
            }),
            models.ScheduledVaccine.create({
              ...fake(models.ScheduledVaccine),
              vaccineId: vaccineTwo.id,
            }),
            models.ScheduledVaccine.create({
              ...fake(models.ScheduledVaccine),
              vaccineId: vaccineThree.id,
            }),
          ]);
          [administeredVaccine1, administeredVaccine2] = await Promise.all([
            models.AdministeredVaccine.create({
              ...fake(models.AdministeredVaccine),
              status: 'GIVEN',
              date: new Date(),
              recorderId: examinerId,
              scheduledVaccineId: scheduleOne.id,
              encounterId: encounter1.id,
            }),
            models.AdministeredVaccine.create({
              ...fake(models.AdministeredVaccine),
              status: 'GIVEN',
              date: new Date(),
              recorderId: examinerId,
              scheduledVaccineId: scheduleTwo.id,
              encounterId: encounter2.id,
            }),
          ]);

          fullSyncedAdministeredVaccine3 = await models.AdministeredVaccine.create({
            ...fake(models.AdministeredVaccine),
            status: 'GIVEN',
            date: new Date(),
            recorderId: examinerId,
            scheduledVaccineId: scheduleThree.id,
            encounterId: fullSyncedPatientEncounter.id,
          });
        });

        it('syncs the configured vaccine encounters when it is enabled and client is mobile', async () => {
          // Create the vaccines to be tested
          const {
            CentralSyncManager: TestCentralSyncManager,
          } = require('../../app/sync/CentralSyncManager');

          // Turn on syncAllEncountersForTheseVaccines config
          TestCentralSyncManager.overrideConfig({
            sync: { syncAllEncountersForTheseVaccines: ['drug-COVAX', 'drug-COVID-19-Pfizer'] },
          });

          const centralSyncManager = new TestCentralSyncManager(ctx);

          const { sessionId } = await centralSyncManager.startSession();
          await waitForSession(centralSyncManager, sessionId);

          await centralSyncManager.setupSnapshotForPull(
            sessionId,
            {
              since: 1,
              facilityId: facility.id,
              isMobile: true,
            },
            () => true,
          );

          const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});

          // Test if the outgoingChanges also sync the configured vaccines and the associated encounters
          expect(outgoingChanges.map(r => r.recordId)).toEqual(
            expect.arrayContaining([administeredVaccine1.id, administeredVaccine2.id]),
          );
        });

        it('does not sync any vaccine encounters when it is disabled and client is mobile', async () => {
          const {
            CentralSyncManager: TestCentralSyncManager,
          } = require('../../app/sync/CentralSyncManager');

          // Turn off syncAllEncountersForTheseVaccines config
          TestCentralSyncManager.overrideConfig({
            sync: { syncAllEncountersForTheseVaccines: [] },
          });

          const centralSyncManager = new TestCentralSyncManager(ctx);

          await models.PatientFacility.create({
            id: models.PatientFacility.generateId(),
            patientId: fullSyncedPatient.id,
            facilityId: facility.id,
          });

          const { sessionId } = await centralSyncManager.startSession();
          await waitForSession(centralSyncManager, sessionId);

          await centralSyncManager.setupSnapshotForPull(
            sessionId,
            {
              since: 1,
              facilityId: facility.id,
              isMobile: true,
            },
            () => true,
          );

          const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});

          // Test if the outgoingChanges do not contain the configured vaccines and the associated encounters
          expect(outgoingChanges.map(r => r.recordId)).not.toEqual(
            expect.arrayContaining([administeredVaccine1.id, administeredVaccine2.id]),
          );
          // Test if the outgoingChanges still contain the vaccine that belong to a marked for sync patient
          expect(outgoingChanges.map(r => r.recordId)).toEqual(
            expect.arrayContaining([fullSyncedAdministeredVaccine3.id]),
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
            facilityId: facility.id,
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

        await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, CURRENT_SYNC_TICK);

        // Encounter data for pushing (not inserted yet)
        const encounterData = {
          ...(await createDummyEncounter(models)),
          id: uuid(),
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
        await centralSyncManager.completePush(sessionId);
        await waitForPushCompleted(centralSyncManager, sessionId);

        // Start the snapshot for pull process
        await centralSyncManager.setupSnapshotForPull(
          sessionId,
          {
            since: CURRENT_SYNC_TICK - 2,
            facilityId: facility.id,
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
  });

  describe('addIncomingChanges', () => {
    beforeEach(async () => {
      jest.resetModules();
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

      jest.doMock('@tamanu/shared/sync', () => ({
        ...jest.requireActual('@tamanu/shared/sync'),
        insertSnapshotRecords: jest.fn(),
      }));

      const centralSyncManager = initializeCentralSyncManager();

      const { insertSnapshotRecords } = require('@tamanu/shared/sync');
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
});
