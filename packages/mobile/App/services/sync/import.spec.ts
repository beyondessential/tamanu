import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { BaseModel } from '~/models/BaseModel';
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

import { createImportPlan, executeImportPlan, ImportPlan } from './import';
import { SyncRecordData } from './source';

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

      it('creates a model with a new id', async () => {
        // arrange
        const record = {
          lastSynced: new Date(1972, 5, 1),
          data: fake(),
        };
        const oldRows = await model.find({ id: record.data.id });
        expect(oldRows).toEqual([]);

        // act
        await executeImportPlan(importPlan, record);

        // assert
        const rows = await model.find({ id: record.data.id });
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

      it('deletes a model when it receives a tombstone', async () => {
        // arrange
        const record = {
          lastSynced: new Date(1972, 5, 1),
          isDeleted: true,
          data: fake(),
        };
        await model.createAndSaveOne(record.data);
        const oldRows = await model.find({ id: record.data.id });
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
        const rows = await model.find({ id: record.data.id });
        expect(rows).toEqual([]);
      });

      it('updates a model with an existing id', async () => {
        // arrange
        const record = {
          lastSynced: new Date(1972, 5, 1),
          data: fake(),
        };
        const newRecord = {
          lastSynced: new Date(1972, 5, 1),
          data: {
            ...fake(),
            id: record.data.id,
          },
        };
        await model.createAndSaveOne(record.data);
        const oldRows = await model.find({ id: record.data.id });
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
        await executeImportPlan(importPlan, newRecord);

        // assert
        const rows = await model.find({ id: record.data.id });
        expect(rows).toEqual([
          {
            ...newRecord.data,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            uploadedAt: null,
            markedForUpload: false, // currently last-write-wins
          }
        ]);
      });
    });
  });
});
