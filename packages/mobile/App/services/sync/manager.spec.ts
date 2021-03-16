import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { Patient } from '~/models/Patient';
import { PatientIssue } from '~/models/PatientIssue';
import { Encounter } from '~/models/Encounter';
import { BaseModel } from '~/models/BaseModel';

import { SyncManager } from './manager';
import { WebSyncSource } from './source';

import {
  fake,
  createRelations,
  toSyncRecord,
  fakeAdministeredVaccine,
  fakeEncounter,
  fakePatient,
  fakeProgram,
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
    describe('surveys', () => {
      it("doesn't lose its associated program while being imported", async () => {
        // arrange
        const { Program, Survey } = Database.models;

        const program = fakeProgram();
        await Program.createAndSaveOne(program);

        const survey: any = fakeSurvey();
        survey.programId = program.id;

        const { syncManager, mockedSource } = createManager();
        mockedSource.downloadRecords.mockReturnValueOnce(Promise.resolve({
          count: 1,
          requestedAt: Date.now(),
          records: [{ data: survey }],
        }));
        mockedSource.downloadRecords.mockReturnValueOnce(Promise.resolve({
          count: 0,
          requestedAt: Date.now(),
          records: [],
        }));
        // act
        await syncManager.downloadAndImport(Survey, 'survey', 0);

        // assert
        const storedSurvey = await Survey.findOne(survey.id, { relations: ['program'] });
        expect(storedSurvey).toMatchObject({ ...survey, program: expect.anything() });
        expect(storedSurvey.program).toMatchObject(program);
      });
    });

    describe('encounters', () => {
      it('downloads and imports an encounter', async () => {
        // arrange
        const { models } = Database;

        const patient = fakePatient();
        await models.Patient.createAndSaveOne(patient);

        const programDataElement = fakeProgramDataElement();
        await models.ProgramDataElement.createAndSaveOne(programDataElement);

        const survey = fakeSurvey();
        await models.Survey.createAndSaveOne(survey);

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

        [0, 1].forEach(() => {
          expect(mockedSource.downloadRecords).toHaveBeenCalledWith(channel, before, expect.any(Number), expect.any(Number));
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
        await Database.models.Patient.createAndSaveOne(patient);

        const encounter = fakeEncounter();
        encounter.patient = patient.id;
        await Database.models.Encounter.createAndSaveOne(encounter);

        const administeredVaccine = fakeAdministeredVaccine();
        administeredVaccine.encounter = encounter.id;
        await Database.models.AdministeredVaccine.createAndSaveOne(administeredVaccine);

        const programDataElement = fakeProgramDataElement();
        await Database.models.ProgramDataElement.createAndSaveOne(programDataElement);

        const survey = fakeSurvey();
        await Database.models.Survey.createAndSaveOne(survey);

        const surveyResponse = fakeSurveyResponse();
        surveyResponse.encounter = encounter.id;
        surveyResponse.survey = survey.id;
        await Database.models.SurveyResponse.createAndSaveOne(surveyResponse);

        const answer = fakeSurveyResponseAnswer();
        answer.response = surveyResponse.id;
        answer.dataElement = programDataElement.id;
        await Database.models.SurveyResponseAnswer.createAndSaveOne(answer);

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

  describe('runPatientSync', () => {
    const models = [Encounter, PatientIssue];

    it('downloads subchannels of a patient', async () => {
      // arrange
      const { syncManager, mockedSource } = createManager();

      const patient = await Patient.createAndSaveOne<Patient>(await fake(Patient));
      const now = Date.now();

      const records = await Promise.all(models.map(model => fake(model, { relations: model.includedSyncRelations })));

      records.forEach(record => {
        mockedSource.downloadRecords.mockResolvedValueOnce({
          count: 1,
          requestedAt: now,
          records: [toSyncRecord({ ...record, patientId: patient.id })],
        });
        mockedSource.downloadRecords.mockResolvedValueOnce({
          count: 0,
          requestedAt: now,
          records: [],
        });
      });

      // act
      await syncManager.runPatientSync(patient);

      // assert
      await Promise.all(records.map(async (record, i) => {
        const model = models[i];
        const dbRecords = await model.find({
          where: { patient: { id: patient.id } },
          relations: model.includedSyncRelations,
        });
        expect(dbRecords).toMatchObject([record]);
      }));

      expect(await Patient.findOne({ id: patient.id })).toHaveProperty('lastSynced', now);
      expect(mockedSource.downloadRecords.mock.calls.length).toEqual(records.length * 2);
      expect(mockedSource.uploadRecords.mock.calls.length).toEqual(0);
    });

    it('uploads subchannels of a patient', async () => {
      // arrange
      const { syncManager, mockedSource } = createManager();

      const patient = await Patient.createAndSaveOne<Patient>(await fake(Patient));
      const otherPatient = await Patient.createAndSaveOne<Patient>(await fake(Patient));
      const now = Date.now();

      const records = await Promise.all(models.map(async model => {
        // make the record itself
        const record = await fake(model, { relations: model.includedSyncRelations });
        await model.createAndSaveOne({ ...record, patient: { id: patient.id } });
        await createRelations(model, record);

        // make another record for a different patient to test isolation
        const otherRecord = await fake(model, { relations: model.includedSyncRelations });
        await model.createAndSaveOne({ ...otherRecord, patient: { id: otherPatient.id } });
        await createRelations(model, otherRecord);

        return record;
      }));

      records.forEach(() => {
        mockedSource.downloadRecords.mockResolvedValueOnce({
          count: 0,
          requestedAt: now,
          records: [],
        });
        mockedSource.uploadRecords.mockResolvedValueOnce({
          count: 1,
          requestedAt: now,
        });
      });

      // act
      await syncManager.runPatientSync(patient);

      // assert
      await Promise.all(records.map(async (record, i) => {
        const syncRecords = mockedSource.uploadRecords.mock.calls[i][1];
        expect(syncRecords).toMatchObject([toSyncRecord(record)]);
      }));

      expect(await Patient.findOne({ id: patient.id })).toHaveProperty('lastSynced', patient.lastSynced); // shouldn't change unless records are downloaded
      expect(mockedSource.downloadRecords.mock.calls.length).toEqual(records.length);
      expect(mockedSource.uploadRecords.mock.calls.length).toEqual(records.length);
    });
  });
});
