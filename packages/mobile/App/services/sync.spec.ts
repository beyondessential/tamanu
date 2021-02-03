import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { SyncManager } from './sync';
import { WebSyncSource } from './syncSource';

import { EncounterType } from '~/types';

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
        // arrange
        const { syncManager, mockedSource } = createManager();
        const patient = {
          id: 'patient_id',
          displayId: 'patient_displayId',
          firstName: 'patient_firstName',
          middleName: 'patient_middleName',
          lastName: 'patient_lastName',
          culturalName: 'patient_culturalName',
          dateOfBirth: new Date(),
          bloodType: 'A+',
          sex: 'female',
        };
        await Database.models.Patient.create(patient);
        const encounter = {
          id: 'encounter-id',
          patient: patient.id, // typeorm has annoying tendencies
          encounterType: EncounterType.Clinic,
          startDate: new Date(),
        };
        const channel = `patient/${encounter.patient}/encounter`;
        await Database.models.Encounter.create(encounter);
        mockedSource.uploadRecords.mockReturnValueOnce({ count: 1, requestedAt: Date.now() });

        // act
        await syncManager.exportAndUpload(Database.models.Encounter, channel);

        // assert
        expect(mockedSource.uploadRecords.mock.calls.length).toBe(1);
        const call = mockedSource.uploadRecords.mock.calls[0];
        const data = {
          ...encounter,
          patientId: patient.id,
        };
        delete data.patient;
        expect(call).toMatchObject([channel, [{ data }]]);
      });
    });
  });
});
