import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { SyncManager } from './manager';
import { WebSyncSource } from './source';

import {
  fakeAdministeredVaccine,
  fakeEncounter,
  fakePatient,
  fakeProgramDataElement,
  fakeSurvey,
  fakeSurveyResponse,
  fakeSurveyResponseAnswer,
} from '/root/tests/helpers/fake';

jest.mock('./source');
const MockedWebSyncSource = <jest.Mock<WebSyncSource>>WebSyncSource;

const createManager = (): ({
  emittedEvents: { action: string | Symbol, event: any }[],
  syncManager: SyncManager,
  mockedSource: any,
}) => {
  // mock WebSyncSource
  MockedWebSyncSource.mockClear();
  const syncManager = new SyncManager(new MockedWebSyncSource(""), { verbose: false });
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

  describe('downloadAndImport', () => {
    describe('encounters', () => {
      it('downloads and imports an encounter', async () => {
        // arrange
        const { models } = Database;

        const patient = fakePatient();
        await models.Patient.create(patient);

        const programDataElement = fakeProgramDataElement();
        await models.ProgramDataElement.create(programDataElement);

        const survey = fakeSurvey();
        await models.Survey.create(survey);

        const channel = `patient/${patient.id}/encounter`;

        const now = Date.now();
        const before = now - 10000;

        // act
        const encounter = fakeEncounter();
        encounter.patientId = patient.id;
        const administeredVaccine = fakeAdministeredVaccine();
        const surveyResponse = fakeSurveyResponse();
        surveyResponse.surveyId = survey.id;
        const answer = fakeSurveyResponseAnswer();
        answer.dataElementId = programDataElement.id;

        const { syncManager, mockedSource } = createManager();
        const records = [
          {
            data: {
              ...encounter,
              administeredVaccines: [
                {
                  data: administeredVaccine,
                },
              ],
              surveyResponses: [
                {
                  data: {
                    ...surveyResponse,
                    answers: [
                      {
                        data: answer,
                      },
                    ],
                  },
                }
              ],
            },
          },
        ];
        mockedSource.downloadRecords.mockReturnValueOnce(Promise.resolve({
          count: 1,
          requestedAt: now,
          records,
        }));
        mockedSource.downloadRecords.mockReturnValueOnce(Promise.resolve({
          count: 0,
          requestedAt: now,
          records: [],
        }));
        await syncManager.downloadAndImport(models.Encounter, channel, before);

        // assert
        expect(mockedSource.downloadRecords).toHaveBeenCalledTimes(2);

        [0, 1].forEach(page => {
          expect(mockedSource.downloadRecords).toHaveBeenCalledWith(channel, before, page, expect.any(Number));
        });

        expect(
          await models.Encounter.findOne({ id: encounter.id }),
        ).toMatchObject(encounter);

        expect(
          await models.AdministeredVaccine.findOne({ id: administeredVaccine.id }),
        ).toMatchObject({
          ...administeredVaccine,
          encounterId: encounter.id,
        });

        expect(
          await models.SurveyResponse.findOne({ id: surveyResponse.id }),
        ).toMatchObject({
          ...surveyResponse,
          encounterId: encounter.id,
        });

        expect(
          await models.SurveyResponseAnswer.findOne({ id: answer.id }),
        ).toMatchObject({
          ...answer,
          responseId: surveyResponse.id,
        });
      });
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

        const encounter = fakeEncounter();
        encounter.patient = patient.id;
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
