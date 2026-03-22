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
  NOTE_TYPES,
  REFERENCE_TYPES,
  SETTING_KEYS,
  SETTINGS_SCOPES,
  SYNC_DIRECTIONS,
  SYSTEM_USER_UUID,
} from '@tamanu/constants';
import { toDateTimeString } from '@tamanu/utils/dateTime';

import {
  createTestContext,
  waitForSession,
  waitForPushCompleted,
  initializeCentralSyncManagerWithContext,
} from '../utilities';
import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../dist/admin/referenceDataImporter';

const doImport = (options, models) => {
  const { file, ...opts } = options;
  return importerTransaction({
    referenceDataImporter,
    file: `./__tests__/sync/testData/${file}.xlsx`,
    models,
    ...opts,
  });
};

describe('CentralSyncManager.setupSnapshotForPull', () => {
  let ctx;
  let models;
  let sequelize;

  const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;
  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

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
        models,
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
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
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
      await models.ReferenceData.create({
        id: NOTE_TYPES.SYSTEM,
        code: 'system',
        name: 'System',
        type: REFERENCE_TYPES.NOTE_TYPE,
      });

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
      const returnedExistingPatient = returnedPatients.find(p => p.data.id === existingPatient.id);
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
