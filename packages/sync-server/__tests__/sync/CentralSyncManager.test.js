import { CURRENT_SYNC_TIME_KEY } from 'shared/sync/constants';
import { SYNC_SESSION_DIRECTION } from 'shared/sync';
import { fake, fakeUser, fakeSurvey, fakeReferenceData } from 'shared/test-helpers/fake';
import { createDummyEncounter } from 'shared/demoData/patients';
import { randomLabRequest } from 'shared/demoData';
import { sleepAsync } from 'shared/utils/sleepAsync';
import { SYNC_DIRECTIONS, LAB_REQUEST_STATUSES } from 'shared/constants';
import { createTestContext } from '../utilities';
import { importerTransaction } from '../../app/admin/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';

jest.setTimeout(100000);

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
  const DEFAULT_CURRENT_SYNC_TIME_VALUE = 2;

  const initializeCentralSyncManager = () => {
    // Have to load test function within test scope so that we can mock dependencies per test case
    const {
      CentralSyncManager: TestCentralSyncManager,
    } = require('../../app/sync/CentralSyncManager');
    return new TestCentralSyncManager(ctx);
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, DEFAULT_CURRENT_SYNC_TIME_VALUE);
  });

  afterAll(() => ctx.close());

  describe('startSession', () => {
    it('creates a new session', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();
      const syncSession = await models.SyncSession.findOne({ where: { id: sessionId } });
      expect(syncSession).not.toBeUndefined();
    });

    // it('tick-tocks the global clock', async () => {
    //   const centralSyncManager = initializeCentralSyncManager();
    //   const { sessionId } = await centralSyncManager.startSession();

    //   const maxAttempts = 20; // safe to wait 20 attempts
    //   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    //     const ready = await centralSyncManager.checkSessionReady(sessionId);
    //     if (ready) {
    //       break;
    //     }
    //   }

    //   const localSystemFact = await models.LocalSystemFact.findOne({
    //     where: { key: CURRENT_SYNC_TIME_KEY },
    //   });
    //   expect(parseInt(localSystemFact.value, 10)).toBe(DEFAULT_CURRENT_SYNC_TIME_VALUE + 2);
    // });

    it('allows concurrent sync sessions', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId: sessionId1 } = await centralSyncManager.startSession();
      const { sessionId: sessionId2 } = await centralSyncManager.startSession();

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
      const syncSession = await centralSyncManager.connectToSession(sessionId);
      expect(syncSession).not.toBeUndefined();
    });
  });

  describe('endSession', () => {
    it('set completedAt when ending an existing session', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();
      await centralSyncManager.endSession(sessionId);
      const syncSession2 = await models.SyncSession.findOne({ where: { id: sessionId } });
      expect(syncSession2.completedAt).not.toBeUndefined();
    });

    it('throws an error when connecting to a session that already ended', async () => {
      const centralSyncManager = initializeCentralSyncManager();
      const { sessionId } = await centralSyncManager.startSession();
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
      it('returns all encounters for marked-for-sync patients', async () => {
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

      const prepareMockedModelQueryPromise = async () => {
        // Build the fakeModelPromise so that it can block the snapshotting process,
        // then we can insert some new records while snapshotting is happening
        let resolveMockedModelQueryPromise;
        const mockedModelQueryPromise = new Promise(resolve => {
          // count: 100 is not correct but shouldn't matter in this test case
          resolveMockedModelQueryPromise = async () => resolve([[{ maxId: null, count: 100 }]]);
        });
        const MockedModel = {
          syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
          associations: [],
          getAttributes() {
            return {
              id: {},
              name: {},
            };
          },
          sequelize: {
            async query() {
              return mockedModelQueryPromise;
            },
          },
        };

        return { MockedModel, resolveMockedModelQueryPromise };
      };

      beforeEach(async () => {
        await models.Facility.truncate({ cascade: true, force: true });
        await models.Program.truncate({ cascade: true, force: true });
        await models.Survey.truncate({ cascade: true, force: true });
        await models.ProgramDataElement.truncate({ cascade: true, force: true });
        await models.SurveyScreenComponent.truncate({ cascade: true, force: true });
        await models.ReferenceData.truncate({ cascade: true, force: true });
        await models.User.truncate({ cascade: true, force: true });
      });

      afterEach(async () => {
        // Revert to the original models
        ctx.store.models = models;
      });

      it('excludes manually inserted records when main snapshot transaction already started', async () => {
        const [facility, program, survey] = await prepareRecordsForSync();

        // Build the fakeModelPromise so that it can block the snapshotting process,
        // then we can insert some new records while snapshotting is happening
        const {
          resolveMockedModelQueryPromise,
          MockedModel,
        } = await prepareMockedModelQueryPromise();

        // Initialize CentralSyncManager with MockedModel
        ctx.store.models = {
          MockedModel,
          ...models,
        };

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();

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

        // wait until setupSnapshotForPull() reach and block the snapshotting process inside the wrapper transaction,
        await sleepAsync(1000);

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
        await resolveMockedModelQueryPromise();
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
          resolveMockedModelQueryPromise,
          MockedModel,
        } = await prepareMockedModelQueryPromise();

        // Initialize CentralSyncManager with MockedModel
        ctx.store.models = {
          MockedModel,
          ...models,
        };

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId } = await centralSyncManager.startSession();

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

        // wait until setupSnapshotForPull() reach and block the snapshotting process inside the wrapper transaction,
        await sleepAsync(1000);

        // Insert the records just before we release the lock,
        // meaning that we're inserting the records below in the middle of the snapshotting process,
        await doImport({ file: 'refdata-valid', dryRun: false }, models);

        // Now release the lock to see if the snapshot captures the newly inserted records above
        await resolveMockedModelQueryPromise();
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
          resolveMockedModelQueryPromise,
          MockedModel,
        } = await prepareMockedModelQueryPromise();

        // Initialize CentralSyncManager with MockedModel
        ctx.store.models = {
          MockedModel,
          ...models,
        };

        const centralSyncManager = initializeCentralSyncManager();
        const { sessionId: sessionIdOne } = await centralSyncManager.startSession();

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

        // wait until setupSnapshotForPull() reach and block the snapshotting process inside the wrapper transaction,
        await sleepAsync(1000);

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
        await centralSyncManager.addIncomingChanges(
          sessionIdTwo,
          changes,
          { pushedSoFar: 3, totalToPush: 3 },
          ['surveys'],
        );

        // Now release the lock to see if the snapshot captures the newly inserted records above
        await resolveMockedModelQueryPromise();
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

    describe('handles SYNC configurations', () => {
      describe('syncAllLabRequests', () => {
        let facility;
        let labRequest1;
        let labRequest2;

        beforeEach(async () => {
          await models.Facility.truncate({ cascade: true, force: true });
          await models.Program.truncate({ cascade: true, force: true });
          await models.ReferenceData.truncate({ cascade: true, force: true });
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
          const encounter1 = await models.Encounter.create({
            ...(await createDummyEncounter(models)),
            patientId: patient1.id,
          });
          const encounter2 = await models.Encounter.create({
            ...(await createDummyEncounter(models)),
            patientId: patient2.id,
          });
          await models.ReferenceData.create({
            id: 'test1',
            type: 'labTestCategory',
            code: 'test1',
            name: 'Test 1',
          });
          labRequest1 = await models.LabRequest.create({
            ...(await randomLabRequest(models, {
              patientId: patient1.id,
              encounterId: encounter1.id,
              status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
            })),
          });
          labRequest2 = await models.LabRequest.create({
            ...(await randomLabRequest(models, {
              patientId: patient2.id,
              encounterId: encounter2.id,
              status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
            })),
          });
        });

        it('syncs all lab requests when enabled', async () => {
          // Enable syncAllLabRequests
          await models.Setting.create({
            facilityId: facility.id,
            key: 'syncAllLabRequests',
            value: true,
          });

          const centralSyncManager = initializeCentralSyncManager();

          const { sessionId } = await centralSyncManager.startSession();

          await centralSyncManager.setupSnapshotForPull(
            sessionId,
            {
              since: 1,
              facilityId: facility.id,
            },
            () => true,
          );

          const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});

          // Test if the outgoingChanges contain the lab requests
          expect(outgoingChanges.map(r => r.recordId)).toEqual(
            expect.arrayContaining([labRequest1.id, labRequest2.id]),
          );
        });

        it('does not sync all lab requests when enabled', async () => {
          // Disable syncAllLabRequests
          await models.Setting.create({
            facilityId: facility.id,
            key: 'syncAllLabRequests',
            value: false,
          });

          // Create marked for sync patient to test if lab request still sync through normal full sync
          const fullSyncedPatient = await models.Patient.create({
            ...fake(models.Patient),
          });
          const fullSyncedPatientEncounter = await models.Encounter.create({
            ...(await createDummyEncounter(models)),
            patientId: fullSyncedPatient.id,
          });
          const fullSyncedPatientLabRequest = await models.LabRequest.create({
            ...(await randomLabRequest(models, {
              patientId: fullSyncedPatientEncounter.id,
              encounterId: fullSyncedPatientEncounter.id,
              status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
            })),
          });
          await models.PatientFacility.create({
            id: models.PatientFacility.generateId(),
            patientId: fullSyncedPatient.id,
            facilityId: facility.id,
          });

          const centralSyncManager = initializeCentralSyncManager();

          const { sessionId } = await centralSyncManager.startSession();

          await centralSyncManager.setupSnapshotForPull(
            sessionId,
            {
              since: 1,
              facilityId: facility.id,
            },
            () => true,
          );

          const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});

          // Test if the outgoingChanges dont contain the lab requests of the patients that are not marked for synced
          expect(outgoingChanges.map(r => r.recordId)).not.toEqual(
            expect.arrayContaining([labRequest1.id, labRequest2.id]),
          );
          // Test if the outgoingChanges contain the lab requests of the patients that are marked for synced
          expect(outgoingChanges.map(r => r.recordId)).toEqual(
            expect.arrayContaining([fullSyncedPatientLabRequest.id]),
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

      jest.doMock('shared/sync', () => ({
        ...jest.requireActual('shared/sync'),
        insertSnapshotRecords: jest.fn(),
      }));

      const centralSyncManager = initializeCentralSyncManager();

      const { insertSnapshotRecords } = require('shared/sync');
      const { sessionId } = await centralSyncManager.startSession();
      await centralSyncManager.addIncomingChanges(sessionId, changes, {
        pushedSofar: 0,
        totalToPush: 2,
      });
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
