import { Database } from '~/infra/db';
import { Patient } from '~/models/Patient';
import { PatientIssue } from '~/models/PatientIssue';
import { Encounter } from '~/models/Encounter';
import { readConfig, writeConfig } from '~/services/config';

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
  fakeUser,
} from '/root/tests/helpers/fake';

jest.mock('./source');
const MockedWebSyncSource = <jest.Mock<WebSyncSource>>WebSyncSource;

const createManager = (): ({
  emittedEvents: { action: string | symbol; event: any }[];
  syncManager: SyncManager;
  mockedSource: any;
}) => {
  // mock WebSyncSource
  MockedWebSyncSource.mockClear();
  const syncManager = new SyncManager(new MockedWebSyncSource(''), { verbose: false });
  expect(MockedWebSyncSource).toHaveBeenCalledTimes(1);
  const mockedSource = MockedWebSyncSource.mock.instances[0];

  // detect emitted events
  const emittedEvents = [];
  syncManager.emitter.on('*', (action: string | symbol, event: any) => {
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
          records: [{ data: survey }],
          cursor: 'finished-sync-1',
        }));
        mockedSource.downloadRecords.mockReturnValueOnce(Promise.resolve({
          count: 0,
          records: [],
        }));
        // act
        await syncManager.downloadAndImport(Survey, 'survey', '0');

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

        const user = fakeUser();
        await models.User.createAndSaveOne(user);

        const patient = fakePatient();
        await models.Patient.createAndSaveOne(patient);

        const programDataElement = fakeProgramDataElement();
        await models.ProgramDataElement.createAndSaveOne(programDataElement);

        const survey = fakeSurvey();
        await models.Survey.createAndSaveOne(survey);

        const channel = `patient/${patient.id}/encounter`;

        // act
        const encounter = fakeEncounter();
        encounter.patientId = patient.id;
        encounter.examinerId = user.id;
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
                },
              ],
            },
          },
        ];
        mockedSource.downloadRecords.mockReturnValueOnce(Promise.resolve({
          count: 1,
          records,
          cursor: 'finished-sync-1',
        }));
        mockedSource.downloadRecords.mockReturnValueOnce(Promise.resolve({
          count: 0,
          records: [],
        }));
        await syncManager.downloadAndImport(models.Encounter, channel, '0');

        // assert
        expect(mockedSource.downloadRecords).toHaveBeenCalledTimes(2);

        expect(mockedSource.downloadRecords)
          .toHaveBeenCalledWith(channel, '0', expect.any(Number)); // first sync starts from '0'
        expect(mockedSource.downloadRecords)
          .toHaveBeenCalledWith(channel, 'finished-sync-1', expect.any(Number)); // subsequent uses cursor

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

        const user = fakeUser();
        await Database.models.User.createAndSaveOne(user);

        const patient = fakePatient();
        await Database.models.Patient.createAndSaveOne(patient);

        const encounter = fakeEncounter();
        encounter.patient = patient.id;
        encounter.examiner = user.id;
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
          examinerId: user.id,
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
        delete data.examiner;
        delete data.administeredVaccines[0].data.encounter;
        delete data.surveyResponses[0].data.encounter;
        delete data.surveyResponses[0].data.survey;
        delete data.surveyResponses[0].data.answers[0].data.dataElement;
        delete data.surveyResponses[0].data.answers[0].data.response;
        expect(call).toMatchObject([channel, [{ data }]]);
      });
    });
  });

  describe('runScheduledSync', () => {
    it('only runs one sync at a time', async () => {
      // arrange
      const { syncManager, mockedSource } = createManager();
      let resolveFirstFetchChannels;
      const firstFetchChannelsPromise = new Promise(resolve => {
        resolveFirstFetchChannels = resolve;
      });
      mockedSource.fetchChannelsWithChanges.mockReturnValueOnce(firstFetchChannelsPromise);

      // act
      const firstSyncPromise = syncManager.runScheduledSync();
      // while previous sync is still running, waiting for the fetch channels request to resolve,
      // kick off another run
      const secondSyncPromise = syncManager.runScheduledSync();
      // resolve the fetch channels request so the first sync can finish
      resolveFirstFetchChannels([]);

      await Promise.all([firstSyncPromise, secondSyncPromise]);

      // assert
      // fetchChannels should only be called once across the two simultaneous syncs
      expect(mockedSource.fetchChannelsWithChanges).toBeCalledTimes(1);
    });

    it('does not download any channels when none have pending changes', async () => {
      // arrange
      const { syncManager, mockedSource } = createManager();
      mockedSource.fetchChannelsWithChanges.mockResolvedValueOnce([]);

      // act
      await syncManager.runScheduledSync();

      // assert
      expect(mockedSource.fetchChannelsWithChanges).toBeCalledTimes(1);
      expect(mockedSource.downloadRecords).not.toBeCalled();
    });

    it('syncs all channels that the server indicates has changes', async () => {
      // arrange
      const { syncManager, mockedSource } = createManager();
      mockedSource.fetchChannelsWithChanges.mockResolvedValueOnce(['user', 'patient']);
      mockedSource.downloadRecords.mockResolvedValue({
        count: 0,
        records: [],
      });

      // act
      await syncManager.runScheduledSync();

      // assert
      expect(mockedSource.fetchChannelsWithChanges).toBeCalledTimes(1);
      expect(mockedSource.downloadRecords).toBeCalledTimes(2);
      expect(mockedSource.downloadRecords).toHaveBeenCalledWith('user', '0', expect.any(Number));
      expect(mockedSource.downloadRecords).toHaveBeenCalledWith('patient', '0', expect.any(Number));
    });

    it('includes subchannels of patients marked for sync', async () => {
      const models = [Encounter, PatientIssue];
      const { syncManager, mockedSource } = createManager();

      // mark all existing patients false as precondition
      await Patient.update({}, { markedForSync: false });

      const patient = await Patient.createAndSaveOne<Patient>({
        ...(await fake(Patient)),
        markedForSync: true,
      });
      const syncablePatients = await Patient.getSyncable();
      expect(syncablePatients.length).toEqual(1);
      expect(syncablePatients[0].id).toEqual(patient.id);

      const records = await Promise.all(models.map(model => fake(
        model,
        { relations: model.includedSyncRelations },
      )));

      mockedSource.fetchChannelsWithChanges.mockResolvedValueOnce([
        `patient/${patient.id}/encounter`,
        `patient/${patient.id}/issue`,
      ]);

      records.forEach(record => {
        mockedSource.downloadRecords.mockResolvedValueOnce({
          count: 1,
          records: [toSyncRecord({ ...record, patientId: patient.id })],
          cursor: 'finished-sync-1',
        });
        mockedSource.downloadRecords.mockResolvedValueOnce({
          count: 0,
          records: [],
        });
      });

      // act
      await syncManager.runScheduledSync();

      // assert
      expect(mockedSource.fetchChannelsWithChanges).toBeCalledTimes(1);
      const receivedArgs = mockedSource.fetchChannelsWithChanges.mock.calls[0];
      expect(receivedArgs[0].map(c => c.channel)).toEqual(expect.arrayContaining([
        `patient/${patient.id}/encounter`,
        `patient/${patient.id}/issue`,
      ]));
      await Promise.all(records.map(async (record, i) => {
        const model = models[i];
        const dbRecords = await model.find({
          where: { patient: { id: patient.id } },
          relations: model.includedSyncRelations,
        });
        expect(dbRecords).toMatchObject([record]);
      }));
      expect(await readConfig(`pullCursor.patient/${patient.id}/encounter`)).toEqual('finished-sync-1');
      expect(await readConfig(`pullCursor.patient/${patient.id}/issue`)).toEqual('finished-sync-1');
      expect(mockedSource.downloadRecords).toBeCalledTimes(records.length * 2);
      expect(mockedSource.uploadRecords).toBeCalledTimes(0);
    });
  });
});
