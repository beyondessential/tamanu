import {
  fakePatient,
  fakeProgram,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeSurvey,
  fakeSurveyScreenComponent,
  fakeUser,
  buildScheduledVaccine,
  buildNestedEncounter,
} from 'shared/test-helpers';
import { createTestContext } from '../utilities';
import { createImportPlan, executeImportPlan } from '~/sync/import';

// converts a db record and all its relations to a sync record
const toSyncRecord = record => ({
  data: Object.entries(record).reduce((data, [k, oldVal]) => {
    let val = oldVal;
    if (Array.isArray(val)) {
      val = toSyncRecord(val);
    }
    return { ...data, [k]: val };
  }, {}),
});

describe('import', () => {
  let models;
  let context;
  beforeAll(async () => {
    context = await createTestContext();
    models = context.models;
  });

  const rootTestCases = [
    ['Patient', fakePatient],
    ['Program', fakeProgram],
    ['ProgramDataElement', fakeProgramDataElement],
    ['ReferenceData', fakeReferenceData],
    ['ScheduledVaccine', () => buildScheduledVaccine(context)],
    ['Survey', fakeSurvey],
    ['SurveyScreenComponent', fakeSurveyScreenComponent],
    ['User', fakeUser],
    ['Encounter', () => buildNestedEncounter(context)],
  ];
  rootTestCases.forEach(([modelName, fakeRecord]) => {
    describe(modelName, () => {
      it('creates the record', async () => {
        // arrange
        const model = models[modelName];
        const record = await fakeRecord();

        // act
        const plan = createImportPlan(model);
        await executeImportPlan(plan, toSyncRecord(record));

        // assert
        expect(await model.findByPk(record.id)).toMatchObject(record);
      });

      it('updates the record', async () => {
        // arrange
        const model = models[modelName];
        const oldRecord = await fakeRecord();
        const newRecord = {
          ...(await fakeRecord()),
          id: oldRecord.id,
        };
        await model.create(oldRecord);

        // act
        const plan = createImportPlan(model);
        await executeImportPlan(plan, toSyncRecord(newRecord));

        // assert
        const dbRecord = await model.findByPk(oldRecord.id);
        expect(dbRecord).toMatchObject(newRecord);
      });

      it('deletes tombstones', async () => {
        // arrange
        const model = models[modelName];
        const record = await fakeRecord();
        await model.create(record);

        // act
        const plan = createImportPlan(model);
        await executeImportPlan(plan, { ...toSyncRecord(record), isDeleted: true });

        // assert
        expect(await model.findByPk(record.id)).toEqual(null);
      });
    });
  });
});
