import { Database } from '~/infra/db';
import { Patient } from '~/models/Patient';
import { PatientIssue } from '~/models/PatientIssue';
import { Encounter } from '~/models/Encounter';
import { readConfig } from '~/services/config';
import { LocalisationService } from '~/services/localisation';
import { IPatient, IScheduledVaccine } from '~/types';

import { MobileSyncManager } from './MobileSyncManager';
import { CentralServerConnection } from './CentralServerConnection';

import {
  fake,
  toSyncRecord,
  fakeAdministeredVaccine,
  fakeEncounter,
  fakePatient,
  fakeProgram,
  fakeProgramDataElement,
  fakeScheduledVaccine,
  fakeSurvey,
  fakeSurveyResponse,
  fakeSurveyResponseAnswer,
  fakeUser,
} from '/root/tests/helpers/fake';

jest.mock('./source');
const MockedWebSyncSource = <jest.Mock<CentralServerConnection>>CentralServerConnection;

jest.mock('~/services/localisation');
const MockedLocalisationService = <jest.Mock<LocalisationService>>LocalisationService;

const createManager = (): {
  emittedEvents: { action: string | symbol; event: any }[];
  syncManager: MobileSyncManager;
  mockedSource: any;
} => {
  // mock WebSyncSource and MockedLocalisationServoce
  MockedWebSyncSource.mockClear();
  MockedLocalisationService.mockClear();

  // TODO: ts isn't recognising these are mocks, so we cast to any
  const mockedSource = new MockedWebSyncSource('') as any;
  const mockedLocalisation = new MockedLocalisationService() as any;

  // instantiate MobileSyncManager
  const syncManager = new MobileSyncManager(mockedSource);
  expect(MockedWebSyncSource).toHaveBeenCalledTimes(1);
  expect(MockedLocalisationService).toHaveBeenCalledTimes(1);

  // mock commonly called methods
  mockedLocalisation.getArrayOfStrings.mockReturnValue([]);
  mockedSource.uploadRecords.mockResolvedValue({ count: 0, requestedAt: Date.now() });

  // detect emitted events
  const emittedEvents = [];
  syncManager.emitter.on('*', (action: string | symbol, event: any) => {
    emittedEvents.push({ action, event });
  });

  return { emittedEvents, syncManager, mockedSource };
};

// describe('MobileSyncManager', () => {
//   beforeAll(async () => {
//     await Database.connect();
//   });

//   describe('runScheduledSync', () => {
//     it('only runs one sync at a time', async () => {
//       // arrange
//       const { syncManager, mockedSource } = createManager();
//       let resolveFirstFetchChannels: (value: string[]) => void;
//       const firstFetchChannelsPromise = new Promise(resolve => {
//         resolveFirstFetchChannels = resolve;
//       });
//       mockedSource.fetchChannelsWithChanges.mockReturnValueOnce(firstFetchChannelsPromise);

//       // act
//       const firstSyncPromise = syncManager.runScheduledSync();
//       // while previous sync is still running, waiting for the fetch channels request to resolve,
//       // kick off another run
//       const secondSyncPromise = syncManager.runScheduledSync();
//       // resolve the fetch channels request so the first sync can finish
//       resolveFirstFetchChannels([]);

//       await Promise.all([firstSyncPromise, secondSyncPromise]);

//       // assert
//       // fetchChannels should only be called once across the two simultaneous syncs
//       expect(mockedSource.fetchChannelsWithChanges).toBeCalledTimes(1);
//     });

//     it('does not download any channels when none have pending changes', async () => {
//       // arrange
//       const { syncManager, mockedSource } = createManager();
//       mockedSource.fetchChannelsWithChanges.mockResolvedValueOnce([]);

//       // act
//       await syncManager.runScheduledSync();

//       // assert
//       expect(mockedSource.fetchChannelsWithChanges).toBeCalledTimes(1);
//       expect(mockedSource.downloadRecords).not.toBeCalled();
//     });

//     it('syncs all channels that the server indicates has changes', async () => {
//       // arrange
//       const { syncManager, mockedSource } = createManager();
//       mockedSource.fetchChannelsWithChanges.mockResolvedValueOnce(['user', 'patient']);
//       mockedSource.downloadRecords.mockResolvedValue({
//         count: 0,
//         records: [],
//       });

//       // act
//       await syncManager.runScheduledSync();

//       // assert
//       expect(mockedSource.fetchChannelsWithChanges).toBeCalledTimes(1);
//       expect(mockedSource.downloadRecords).toBeCalledTimes(2);
//       expect(mockedSource.downloadRecords).toHaveBeenCalledWith('user', '0', expect.any(Number), { noCount: false });
//       expect(mockedSource.downloadRecords).toHaveBeenCalledWith('patient', '0', expect.any(Number), { noCount: false });
//     });

//     it('includes subchannels of patients marked for sync', async () => {
//       const models = [Encounter, PatientIssue];
//       const { syncManager, mockedSource } = createManager();

//       // mark all existing patients false as precondition
//       await Patient.update({}, { markedForSync: false });

//       const patient = await Patient.createAndSaveOne<Patient>({
//         ...(await fake(Patient)),
//         markedForSync: true,
//       });
//       const syncablePatients = await Patient.getSyncable();
//       expect(syncablePatients.length).toEqual(1);
//       expect(syncablePatients[0].id).toEqual(patient.id);

//       const records = await Promise.all(models.map(model => fake(
//         model,
//         { relations: model.includedSyncRelations },
//       )));

//       mockedSource.fetchChannelsWithChanges.mockResolvedValueOnce([
//         `patient/${patient.id}/encounter`,
//         `patient/${patient.id}/issue`,
//       ]);

//       records.forEach(record => {
//         mockedSource.downloadRecords.mockResolvedValueOnce({
//           count: 1,
//           records: [toSyncRecord({ ...record, patientId: patient.id })],
//           cursor: 'finished-sync-1',
//         });
//         mockedSource.downloadRecords.mockResolvedValueOnce({
//           count: 0,
//           records: [],
//         });
//       });

//       // act
//       await syncManager.runScheduledSync();

//       // assert
//       expect(mockedSource.fetchChannelsWithChanges).toBeCalledTimes(1);
//       const receivedArgs = mockedSource.fetchChannelsWithChanges.mock.calls[0];
//       expect(receivedArgs[0].map(({ channel }) => channel)).toEqual(expect.arrayContaining([
//         `patient/${patient.id}/encounter`,
//         `patient/${patient.id}/issue`,
//       ]));
//       await Promise.all(records.map(async (record, i) => {
//         const model = models[i];
//         const dbRecords = await model.find({
//           where: { patient: { id: patient.id } },
//           relations: model.includedSyncRelations,
//         });
//         expect(dbRecords).toMatchObject([record]);
//       }));
//       expect(await readConfig(`pullCursor.patient/${patient.id}/encounter`)).toEqual('finished-sync-1');
//       expect(await readConfig(`pullCursor.patient/${patient.id}/issue`)).toEqual('finished-sync-1');
//       expect(mockedSource.downloadRecords).toBeCalledTimes(records.length * 2);
//       expect(mockedSource.uploadRecords).toBeCalledTimes(1);
//     });
//   });
// });
