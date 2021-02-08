import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { createImportPlan, executeImportPlan, ImportPlan } from './importExport';
import { ReferenceData } from '~/models/ReferenceData';

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
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
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
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        uploadedAt: null,
        markedForUpload: true,
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
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
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
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
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
