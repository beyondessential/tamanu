import {
  CURRENT_SYNC_TIME_KEY,
  LOOKUP_UP_TO_TICK_KEY,
} from '@tamanu/shared/sync/constants';
import { SYNC_SESSION_DIRECTION } from '@tamanu/shared/sync';
import { fake, fakeUser } from '@tamanu/shared/test-helpers/fake';
import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { createTestContext } from '../utilities';
import { importerTransaction } from '../../dist/admin/importerEndpoint';
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

const waitForSession = async (centralSyncManager, sessionId) => {
  let ready = false;
  while (!ready) {
    ready = await centralSyncManager.checkSessionReady(sessionId);
    await sleepAsync(100);
  }
};

describe('sync lookup table', () => {
  let ctx;
  let models;

  const DEFAULT_CURRENT_SYNC_TIME_VALUE = 2;

  const initializeCentralSyncManager = () => {
    // Have to load test function within test scope so that we can mock dependencies per test case
    const {
      CentralSyncManager: TestCentralSyncManager,
    } = require('../../dist/sync/CentralSyncManager');
    return new TestCentralSyncManager(ctx);
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
      buildSyncLookupFilter: () => null,
    };

    return {
      MockedPullOnlyModel,
      resolveMockedQueryPromise,
      modelQueryWaitingPromise,
    };
  };

  describe('updateLookupTable', () => {
    beforeEach(async () => {
      jest.resetModules();
      await models.SyncLookup.truncate({ force: true });
      await models.LocalSystemFact.set(LOOKUP_UP_TO_TICK_KEY, null);
      await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, DEFAULT_CURRENT_SYNC_TIME_VALUE);
      await models.Facility.truncate({ cascade: true, force: true });
      await models.Program.truncate({ cascade: true, force: true });
      await models.Survey.truncate({ cascade: true, force: true });
      await models.ProgramDataElement.truncate({ cascade: true, force: true });
      await models.SurveyScreenComponent.truncate({ cascade: true, force: true });
      await models.ReferenceData.truncate({ cascade: true, force: true });
      await models.User.truncate({ cascade: true, force: true });
    });

    beforeAll(async () => {
      ctx = await createTestContext();
      ({ models } = ctx.store);
    });

    it('inserts records into sync lookup table', async () => {
      const patient1 = await models.Patient.create(fake(models.Patient));

      const centralSyncManager = initializeCentralSyncManager();

      await centralSyncManager.updateLookupTable();

      const lookupData = await models.SyncLookup.findAll({});

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

    it('does not include records inserted when updating lookup table already started', async () => {
      const [facility, program, survey] = await prepareRecordsForSync();

      // Build the fakeModelPromise so that it can block the snapshotting process,
      // then we can insert some new records while snapshotting is happening
      const {
        resolveMockedQueryPromise,
        modelQueryWaitingPromise,
        MockedPullOnlyModel,
      } = await prepareMockedPullOnlyModelQueryPromise();

      ctx.store.models = {
        MockedPullOnlyModel,
        ...models,
      };

      const centralSyncManager = initializeCentralSyncManager();

      // Start the update lookup table process
      const updateLookupTablePromise = centralSyncManager.updateLookupTable();

      // wait until setupSnapshotForPull() reaches snapshotting for MockedModel
      // and block the snapshotting process inside the wrapper transaction,
      await modelQueryWaitingPromise;

      // Insert the records just before we release the lock,
      // meaning that we're inserting the records below in the middle of the snapshotting process,
      console.log('manually inserting records');
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

      await updateLookupTablePromise;

      const lookupData = await models.SyncLookup.findAll({});

      expect(lookupData).toHaveLength(3);

      // Revert the models
      ctx.store.models = models;
    });

    it('does not include records inserted from importer when updating lookup table already started', async () => {
      await prepareRecordsForSync();

      // Build the fakeModelPromise so that it can block the snapshotting process,
      // then we can insert some new records while snapshotting is happening
      const {
        resolveMockedQueryPromise,
        modelQueryWaitingPromise,
        MockedPullOnlyModel,
      } = await prepareMockedPullOnlyModelQueryPromise();

      ctx.store.models = {
        MockedPullOnlyModel,
        ...models,
      };

      const centralSyncManager = initializeCentralSyncManager();

      // Start the update lookup table process
      const updateLookupTablePromise = centralSyncManager.updateLookupTable();

      // wait until setupSnapshotForPull() reaches snapshotting for MockedModel
      // and block the snapshotting process inside the wrapper transaction,
      await modelQueryWaitingPromise;

      // Insert the records just before we release the lock,
      // meaning that we're inserting the records below in the middle of the snapshotting process,
      await doImport({ file: 'refdata-valid', dryRun: false }, models);

      // Now release the lock to see if the snapshot captures the newly inserted records above
      await resolveMockedQueryPromise();
      await sleepAsync(20);

      await updateLookupTablePromise;

      const lookupData = await models.SyncLookup.findAll({});

      expect(lookupData).toHaveLength(3);

      // Revert the models
      ctx.store.models = models;
    });

    it('does not include records inserted from another sync session when updating lookup table already started', async () => {
      await prepareRecordsForSync();

      // Build the fakeModelPromise so that it can block the snapshotting process,
      // then we can insert some new records while snapshotting is happening
      const {
        resolveMockedQueryPromise,
        modelQueryWaitingPromise,
        MockedPullOnlyModel,
      } = await prepareMockedPullOnlyModelQueryPromise();

      ctx.store.models = {
        MockedPullOnlyModel,
        ...models,
      };

      const centralSyncManager = initializeCentralSyncManager();

      // Start the update lookup table process
      const updateLookupTablePromise = centralSyncManager.updateLookupTable();

      // wait until setupSnapshotForPull() reaches snapshotting for MockedModel
      // and block the snapshotting process inside the wrapper transaction,
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

      // Now release the lock to see if the snapshot captures the newly inserted records above
      await resolveMockedQueryPromise();
      await sleepAsync(20);

      await updateLookupTablePromise;

      const lookupData = await models.SyncLookup.findAll({});

      expect(lookupData).toHaveLength(3);

      // Revert the models
      ctx.store.models = models;
    });
  });

  describe('snapshot for models', () => {
    describe('Encounter', () => {
      it('Encounter returns correct records', async () => {
        const facility = await models.Facility.create({
          ...fake(models.Facility),
          name: 'Utopia HQ',
        });
        const location = await models.Location.create({
          ...fake(models.Location),
          facilityId: facility.id,
        });
        const department = await models.Department.create({
          ...fake(models.Department),
          facilityId: facility.id,
        });
        const examiner = await models.User.create(fakeUser());

        const patient = await models.Patient.create({
          ...fake(models.Patient),
        });
        const encounter = await models.Encounter.create({
          ...fake(models.Encounter),
          patientId: patient.id,
          locationId: location.id,
          departmentId: department.id,
          examinerId: examiner.id,
        });

        const centralSyncManager = initializeCentralSyncManager();
        await centralSyncManager.updateLookupTable();

        const encounterLookupData = await models.SyncLookup.findOne({
          where: { recordType: 'encounters' },
        });

        expect(encounterLookupData).toEqual(
          expect.objectContaining({
            recordId: encounter.id,
            recordType: 'encounters',
            patientId: patient.id,
            encounterId: encounter.id,
            facilityId: null,
            isLabRequest: false,
            isDeleted: false,
          }),
        );
      });
    });

    describe('Setting', () => {
      it('Setting returns correct records', async () => {
        const facility = await models.Facility.create({
          ...fake(models.Facility),
          name: 'Utopia HQ',
        });
        const setting = await models.Setting.create({
          facilityId: facility.id,
          key: 'test',
          value: { test: 'test' },
        });

        const centralSyncManager = initializeCentralSyncManager();
        await centralSyncManager.updateLookupTable();

        const settingLookupData = await models.SyncLookup.findOne({
          where: { recordType: 'settings' },
        });

        expect(settingLookupData).toEqual(
          expect.objectContaining({
            recordId: setting.id,
            recordType: 'settings',
            patientId: null,
            encounterId: null,
            facilityId: setting.facilityId,
            isLabRequest: false,
            isDeleted: false,
          }),
        );
        console.log('settingLookupData', settingLookupData);
      });
    });

    describe('PatientFacility', () => {
      it('PatientFacility returns correct records', async () => {
        const facility = await models.Facility.create({
          ...fake(models.Facility),
          name: 'Utopia HQ',
        });
        const patient = await models.Patient.create({
          ...fake(models.Patient),
        });
        const patientFacility = await models.PatientFacility.create({
          facilityId: facility.id,
          patientId: patient.id,
        });
        const centralSyncManager = initializeCentralSyncManager();
        await centralSyncManager.updateLookupTable();

        const patientFacilityLookupData = await models.SyncLookup.findOne({
          where: { recordType: 'patient_facilities' },
        });

        expect(patientFacilityLookupData).toEqual(
          expect.objectContaining({
            recordId: patientFacility.id,
            recordType: 'patient_facilities',
            patientId: patient.id,
            encounterId: null,
            facilityId: facility.id,
            isLabRequest: false,
            isDeleted: false,
          }),
        );
        console.log('settingLookupData', patientFacilityLookupData);
      });
    });
  });
});
