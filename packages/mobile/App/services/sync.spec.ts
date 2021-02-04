import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { SyncManager } from './sync';
import { WebSyncSource } from './syncSource';

import { EncounterType } from '~/types';

import {
  fakePatient,
  fakeAdministeredVaccine,
  fakeProgramDataElement,
  fakeSurvey,
  fakeSurveyResponse,
  fakeSurveyResponseAnswer,
} from '/root/tests/helpers/fake';

jest.mock('./syncSource');
const MockedWebSyncSource = <jest.Mock<WebSyncSource>>WebSyncSource;

const createManager = (): ({
  emittedEvents: { action: string | Symbol, event: any }[],
  syncManager: SyncManager,
  mockedSource: any,
}) => {
  // mock WebSyncSource
  MockedWebSyncSource.mockClear();
  const syncManager = new SyncManager(new MockedWebSyncSource(""));
  expect(MockedWebSyncSource).toHaveBeenCalledTimes(1);
  const mockedSource = MockedWebSyncSource.mock.instances[0];

  // detect emitted events
  const emittedEvents = [];
  syncManager.emitter.on('*', (action: string | Symbol, event: any) => {
    emittedEvents.push({ action, event });
  });

  return { emittedEvents, syncManager, mockedSource };
};

describe('SyncManager', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  describe('importRecord', () => {
    it('creates a model with a new id', async () => {
      // arrange
      const record = {
        lastSynced: new Date(1972, 5, 1),
        data: {
          id: uuidv4(),
          updatedAt: new Date(1971, 5, 1),
          name: 'Not a real ICD-10 code',
          code: 'not-a-real-icd-10-code',
          type: 'ICD10',
        },
      };
      const { emittedEvents, syncManager } = createManager();
      const oldRows = await Database.models.ReferenceData.find({ id: record.data.id });
      expect(oldRows).toEqual([]);

      // act
      await syncManager.importRecord(Database.models.ReferenceData, record);

      // assert
      expect(emittedEvents.map(({ action }) => action)).toContain('syncedRecord');
      const rows = await Database.models.ReferenceData.find({ id: record.data.id });
      expect(rows).toEqual([
        {
          ...record.data,
          createdAt: expect.anything(),
          uploadedAt: null,
          markedForUpload: false,
        }
      ]);
    });

    it('updates a model with an existing id', async () => {
      // arrange
      const record = {
        lastSynced: new Date(1972, 5, 1),
        data: {
          id: uuidv4(),
          updatedAt: new Date(1971, 5, 1),
          name: 'Old name',
          code: 'old-code',
          type: 'ICD10',
        },
      };
      await Database.models.ReferenceData.create(record.data);
      const { emittedEvents, syncManager } = createManager();
      const oldRows = await Database.models.ReferenceData.find({ id: record.data.id });
      expect(oldRows).toEqual([
        {
          ...record.data,
          createdAt: expect.anything(),
          uploadedAt: null,
          markedForUpload: true,
        },
      ]);

      // act
      await syncManager.importRecord(Database.models.ReferenceData, {
        ...record,
        data: {
          ...record.data,
          name: 'New name',
          code: 'new-code',
        },
      });

      // assert
      expect(emittedEvents.map(({ action }) => action)).toContain('syncedRecord');
      const rows = await Database.models.ReferenceData.find({ id: record.data.id });
      expect(rows).toEqual([
        {
          ...record.data,
          createdAt: expect.anything(),
          uploadedAt: null,
          markedForUpload: false, // currently last-write-wins
          name: 'New name',
          code: 'new-code',
        }
      ]);
    });

    it('deletes a model when it receives a tombstone', async () => {
      // arrange
      const record = {
        lastSynced: new Date(1972, 5, 1),
        isDeleted: true,
        data: {
          id: uuidv4(),
          updatedAt: new Date(1971, 5, 1),
          name: 'Old name',
          code: 'old-code',
          type: 'ICD10',
        },
      };
      await Database.models.ReferenceData.create(record.data);
      const oldRows = await Database.models.ReferenceData.find({ id: record.data.id });
      expect(oldRows).toEqual([
        {
          ...record.data,
          createdAt: expect.anything(),
          uploadedAt: null,
          markedForUpload: true,
        },
      ]);

      // act
      const { emittedEvents, syncManager } = createManager();
      await syncManager.importRecord(Database.models.ReferenceData, record);

      // assert
      expect(emittedEvents.map(({ action }) => action)).toContain('syncedRecord');
      const rows = await Database.models.ReferenceData.find({ id: record.data.id });
      expect(rows).toEqual([]);
    });
  });

  describe('exportAndUpload', () => {
    describe('encounters', () => {
      it('exports and uploads an encounter', async () => {
        // TODO: find a workaround for the typeorm Id stripping

        // arrange
        const { syncManager, mockedSource } = createManager();
        const patient = fakePatient();
        await Database.models.Patient.create(patient);

        const encounter = {
          id: 'encounter-id',
          patient: patient.id, // typeorm has annoying tendencies
          encounterType: EncounterType.Clinic,
          startDate: new Date(),
        };
        await Database.models.Encounter.create(encounter);

        const administeredVaccine = fakeAdministeredVaccine();
        administeredVaccine.encounter = encounter.id;
        await Database.models.AdministeredVaccine.create(administeredVaccine);

        const programDataElement = fakeProgramDataElement();
        await Database.models.ProgramDataElement.create(programDataElement);

        const survey = fakeSurvey();
        await Database.models.Survey.create(survey);

        const surveyResponse = fakeSurveyResponse();
        surveyResponse.encounter = encounter.id;
        surveyResponse.survey = survey.id;
        await Database.models.SurveyResponse.create(surveyResponse);

        const answer = fakeSurveyResponseAnswer();
        answer.response = surveyResponse.id;
        answer.dataElement = programDataElement.id;
        await Database.models.SurveyResponseAnswer.create(answer);

        mockedSource.uploadRecords.mockReturnValueOnce({ count: 1, requestedAt: Date.now() });
        const channel = `patient/${encounter.patient}/encounter`;

        // act
        await syncManager.exportAndUpload(Database.models.Encounter, channel);

        // assert
        expect(mockedSource.uploadRecords.mock.calls.length).toBe(1);
        const call = mockedSource.uploadRecords.mock.calls[0];
        const data = {
          ...encounter,
          patientId: patient.id,
          administeredVaccines: [
            {
              data: {
                ...administeredVaccine,
                encounterId: encounter.id,
              },
            },
          ],
          surveyResponses: [
            {
              data: {
                ...surveyResponse,
                encounterId: encounter.id,
                surveyId: survey.id,
                answers: [
                  {
                    data: {
                      ...answer,
                      responseId: surveyResponse.id,
                      dataElementId: programDataElement.id,
                    },
                  },
                ],
              },
            },
          ],
        };
        delete data.patient;
        delete data.administeredVaccines[0].data.encounter;
        delete data.surveyResponses[0].data.encounter;
        delete data.surveyResponses[0].data.survey;
        delete data.surveyResponses[0].data.answers[0].data.dataElement;
        delete data.surveyResponses[0].data.answers[0].data.response;
        expect(call).toMatchObject([channel, [{ data }]]);
      });
    });
  });
});
