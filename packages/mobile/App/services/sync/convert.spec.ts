import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { SyncManager } from '.';
import { WebSyncSource } from './source';
import { createImportPlan, executeImportPlan, ImportPlan } from './convert';
import { ReferenceData } from '~/models/ReferenceData';

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

beforeAll(async () => {
  await Database.connect();
});

describe('ImportPlan', () => {
  let importPlan: ImportPlan;
  beforeAll(() => {
    importPlan = createImportPlan(ReferenceData);
  });

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
    const oldRows = await Database.models.ReferenceData.find({ id: record.data.id });
    expect(oldRows).toEqual([]);

    // act
    await executeImportPlan(importPlan, record);

    // assert
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
    const oldRows = await Database.models.ReferenceData.find({ id: record.data.id });
    expect(oldRows).toEqual([
      {
        ...record.data,
        createdAt: expect.anything(),
        uploadedAt: null,
        markedForUpload: true,  // TODO: should we lock the table while syncing to prevent this from happening?
      },
    ]);

    // act
    await executeImportPlan(importPlan, {
      ...record,
      data: {
        ...record.data,
        name: 'New name',
        code: 'new-code',
      },
    });

    // assert
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
    await executeImportPlan(importPlan, record);

    // assert
    const rows = await Database.models.ReferenceData.find({ id: record.data.id });
    expect(rows).toEqual([]);
  });
});
