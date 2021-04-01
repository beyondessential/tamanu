/* eslint-disable no-restricted-syntax */
import { Database } from '~/infra/db';
import { chunkRows } from '~/infra/db/helpers';
import { BaseModel, ModelPojo } from '~/models/BaseModel';
import { ReferenceData } from '~/models/ReferenceData';
import { User } from '~/models/User';
import { Patient } from '~/models/Patient';
import { ProgramDataElement } from '~/models/ProgramDataElement';
import { ScheduledVaccine } from '~/models/ScheduledVaccine';
import { Survey } from '~/models/Survey';
import { SurveyScreenComponent } from '~/models/SurveyScreenComponent';
import {
  fakePatient,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeScheduledVaccine,
  fakeSurvey,
  fakeSurveyScreenComponent,
  fakeUser,
} from '/root/tests/helpers/fake';

import { createImportPlan, executeImportPlan, ImportFailure, ImportPlan } from './import';
import { SyncRecord, SyncRecordData } from './source';

const RECORDS_PER_TEST = 100;

type SyncRecordOverrides = {
  isDeleted?: boolean;
  data?: object;
}

const generateSyncRecord = (fake, overrides: SyncRecordOverrides = {}): SyncRecord => ({
  ...overrides,
  data: {
    ...fake(),
    ...overrides.data,
  },
});

const generateSyncRecords = (
  fake,
  overrides?,
  count = RECORDS_PER_TEST,
): SyncRecord[] => new Array(count)
  .fill(0)
  .map(() => generateSyncRecord(fake, overrides));

const syncRecordsToRows = (syncRecords, overrides = {}): BaseModel[] => syncRecords
  .map(sr => ({
    ...sr.data,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    uploadedAt: null,
    markedForUpload: true,
    ...overrides,
  }));

const buildCompareOn = (comparisonKey: string) => (
  a: Record<string, any>,
  b: Record<string, any>,
): number => {
  if (a[comparisonKey] < b[comparisonKey]) {
    return -1;
  }
  if (a[comparisonKey] > b[comparisonKey]) {
    return 1;
  }
  return 0;
};

function sortRowsById<T extends ModelPojo>(rows: T[]): T[] {
  return rows.sort(buildCompareOn('id'));
}

function sortFailuresByRecordId<T extends ImportFailure>(rows: T[]): T[] {
  return rows.sort(buildCompareOn('recordId'));
}

const findPlainObjectRowsById = async (model, ids): Promise<ModelPojo[]> => {
  const rows = await model.findByIds(ids);
  return rows.map(r => r.getPlainData());
};

function shuffleArrayInPlace(array: any[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign
    [array[i], array[j]] = [array[j], array[i]];
  }
}

beforeAll(async () => {
  await Database.connect();
});

describe('ImportPlan', () => {
  type TestCase = [typeof BaseModel, () => SyncRecordData];

  const testCases: TestCase[] = [
    [ReferenceData, fakeReferenceData],
    [User, fakeUser],
    [ScheduledVaccine, fakeScheduledVaccine],
    [Survey, fakeSurvey],
    [ProgramDataElement, fakeProgramDataElement],
    [SurveyScreenComponent, fakeSurveyScreenComponent],
    [Patient, fakePatient],
  ];

  testCases.forEach(([model, fake]) => {
    describe(model.name, () => {
      let importPlan: ImportPlan;
      beforeAll(() => {
        importPlan = createImportPlan(model);
      });

      it('creates models with new ids', async () => {
        // arrange
        const records = generateSyncRecords(fake);
        const recordIds = records.map(r => r.data.id);
        const oldRows = await findPlainObjectRowsById(model, recordIds);
        expect(oldRows).toEqual([]);

        // act
        await executeImportPlan(importPlan, records);

        // assert
        const rows = await findPlainObjectRowsById(model, recordIds);
        expect(sortRowsById(rows)).toEqual(sortRowsById(syncRecordsToRows(
          records,
          {
            markedForUpload: false,
          },
        )));
      });

      it('deletes models when it receives tombstones', async () => {
        // arrange
        const records = generateSyncRecords(fake, { isDeleted: true });
        const recordIds = records.map(r => r.data.id);
        for (const chunkOfRows of chunkRows(records.map(r => ({ ...r.data })))) {
          await model.insert(chunkOfRows);
        }
        const oldRows = await findPlainObjectRowsById(model, recordIds);
        expect(sortRowsById(oldRows)).toEqual(sortRowsById(syncRecordsToRows(records)));

        // act
        await executeImportPlan(importPlan, records);

        // assert
        const rows = await findPlainObjectRowsById(model, recordIds);
        expect(rows).toEqual([]);
      });

      it('updates models with existing ids', async () => {
        // arrange
        const records = generateSyncRecords(fake);
        const recordIds = records.map(r => r.data.id);
        const newRecords = recordIds.map(id => generateSyncRecord(fake, { data: { id } }));
        for (const chunkOfRows of chunkRows(records.map(r => ({ ...r.data })))) {
          await model.insert(chunkOfRows);
        }
        const oldRows = await model.findByIds(recordIds);
        expect(sortRowsById(oldRows)).toEqual(sortRowsById(syncRecordsToRows(records)));

        // act
        await executeImportPlan(importPlan, newRecords);

        // assert
        const rows = await findPlainObjectRowsById(model, recordIds);
        expect(sortRowsById(rows)).toEqual(sortRowsById(syncRecordsToRows(
          newRecords,
          {
            markedForUpload: false, // currently last-write-wins
          },
        )));
      });
    });
  });

  // global tests, just use a single model type
  describe('General sync tests (against Patient model)', () => {
    let importPlan;
    beforeEach(() => {
      importPlan = createImportPlan(Patient);
    });

    it('handles mixed creates, updates, and deletes', async () => {
      // arrange
      const recordsPerVerb = 10;
      const recordsToCreate = generateSyncRecords(fakePatient, {}, recordsPerVerb);
      const recordsToUpdateOld = generateSyncRecords(fakePatient, {}, recordsPerVerb);
      const recordIdsToUpdate = recordsToUpdateOld.map(r => r.data.id);
      const recordsToUpdateNew = recordIdsToUpdate
        .map(id => generateSyncRecord(fakePatient, { data: { id } }));
      const recordsToDelete = generateSyncRecords(fakePatient, { isDeleted: true }, recordsPerVerb);
      const allRecordsForImport = [...recordsToCreate, ...recordsToUpdateNew, ...recordsToDelete];
      shuffleArrayInPlace(allRecordsForImport); // mix up to test it pulls them apart correctly
      const allRecordIds = allRecordsForImport.map(r => r.data.id);

      const recordsForInsert = [...recordsToUpdateOld, ...recordsToDelete];
      for (const chunkOfRows of chunkRows(recordsForInsert.map(r => ({ ...r.data })))) {
        await Patient.insert(chunkOfRows);
      }
      const oldRows = await findPlainObjectRowsById(Patient, allRecordIds);
      expect(sortRowsById(oldRows)).toEqual(sortRowsById(syncRecordsToRows(recordsForInsert)));

      // act
      await executeImportPlan(importPlan, allRecordsForImport);

      // assert
      const rows = await findPlainObjectRowsById(Patient, allRecordIds);
      const expectedRows = syncRecordsToRows(
        [...recordsToCreate, ...recordsToUpdateNew],
        { markedForUpload: false },
      );
      expect(sortRowsById(rows)).toEqual(sortRowsById(expectedRows));
    });

    it('returns failures in the import response for creates', async () => {
      // arrange
      const recordCount = 10;
      const failureIndexes = [2, 4, 5];
      const records = generateSyncRecords(fakePatient, {}, recordCount);
      failureIndexes.forEach(i => {
        records[i].data.displayId = null; // displayId has a not null constraint
      });
      const recordIds = records.map(r => r.data.id);
      const failureIds = failureIndexes.map(i => recordIds[i]);

      const oldRows = await findPlainObjectRowsById(Patient, recordIds);
      expect(sortRowsById(oldRows)).toEqual([]);

      // act
      const { failures } = await executeImportPlan(importPlan, records);

      // assert
      const rows = await findPlainObjectRowsById(Patient, recordIds);
      const expectedSuccesses = records.filter(r => !failureIds.includes(r.data.id));
      const expectedRows = syncRecordsToRows(
        [...expectedSuccesses],
        { markedForUpload: false },
      );
      expect(sortRowsById(rows)).toEqual(sortRowsById(expectedRows));

      const expectedFailures = failureIds.map(id => ({ error: expect.any(String), recordId: id }));
      expect(sortFailuresByRecordId(failures)).toEqual(sortFailuresByRecordId(expectedFailures));
    });

    it('returns all sync records as failures if delete throws an error', async () => {
      // mock delete to throw an error, because there is no legitimate delete error case
      const realDelete = Patient.delete;
      Patient.delete = jest.fn(() => { throw new Error('Mock error'); });

      // arrange
      const recordCount = 10;
      const records = generateSyncRecords(fakePatient, { isDeleted: true }, recordCount);
      const recordIds = records.map(r => r.data.id);

      for (const chunkOfRows of chunkRows(records.map(r => ({ ...r.data })))) {
        await Patient.insert(chunkOfRows);
      }
      const oldRows = await findPlainObjectRowsById(Patient, recordIds);
      expect(sortRowsById(oldRows)).toEqual(sortRowsById(syncRecordsToRows(records)));

      // act
      const { failures } = await executeImportPlan(importPlan, records);

      // assert
      const rows = await findPlainObjectRowsById(Patient, recordIds);
      expect(sortRowsById(rows)).toEqual(oldRows);

      const expectedFailures = recordIds.map(id => ({ error: expect.any(String), recordId: id }));
      expect(sortFailuresByRecordId(failures)).toEqual(sortFailuresByRecordId(expectedFailures));

      // unmock delete
      Patient.delete = realDelete;
    });

    it('returns failures in the import response for updates', async () => {
      // arrange
      const recordCount = 10;
      const failureIndexes = [2, 4, 5];
      const recordsToUpdateOld = generateSyncRecords(fakePatient, {}, recordCount);
      const recordIdsToUpdate = recordsToUpdateOld.map(r => r.data.id);
      const recordsToUpdateNew = recordIdsToUpdate
        .map(id => generateSyncRecord(fakePatient, { data: { id } }));
      failureIndexes.forEach(i => {
        recordsToUpdateNew[i].data.displayId = null; // displayId has a not null constraint
      });
      const recordIds = recordsToUpdateOld.map(r => r.data.id);
      const failureIds = failureIndexes.map(i => recordIds[i]);

      for (const chunkOfRows of chunkRows(recordsToUpdateOld.map(r => ({ ...r.data })))) {
        await Patient.insert(chunkOfRows);
      }
      const oldRows = await findPlainObjectRowsById(Patient, recordIds);
      expect(sortRowsById(oldRows)).toEqual(sortRowsById(syncRecordsToRows(recordsToUpdateOld)));

      // act
      const { failures } = await executeImportPlan(importPlan, recordsToUpdateNew);

      // assert
      const rows = await findPlainObjectRowsById(Patient, recordIds);
      const expectedSuccessRows = syncRecordsToRows(
        recordsToUpdateNew.filter(r => !failureIds.includes(r.data.id)),
        { markedForUpload: false },
      );

      // failures stay as they were when first inserted
      const expectedFailureRows = syncRecordsToRows(
        recordsToUpdateOld.filter(r => failureIds.includes(r.data.id)),
        { markedForUpload: true },
      );
      const expectedRows = [...expectedSuccessRows, ...expectedFailureRows];
      expect(sortRowsById(rows)).toEqual(sortRowsById(expectedRows));

      const expectedFailures = failureIds.map(id => ({ error: expect.any(String), recordId: id }));
      expect(sortFailuresByRecordId(failures)).toEqual(sortFailuresByRecordId(expectedFailures));
    });
  });
});
