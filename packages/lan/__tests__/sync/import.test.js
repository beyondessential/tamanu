import {
  fakePatient,
  fakeProgram,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeSurvey,
  fakeSurveyScreenComponent,
  fakeUser,
  buildScheduledVaccine,
} from 'shared/test-helpers';
import { createTestContext } from '../utilities';
import { createImportPlan, executeImportPlan } from '~/sync/import';

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
  ];
  rootTestCases.forEach(([modelName, fakeRecord]) => {
    describe(modelName, () => {
      it('creates the record', async () => {
        // arrange
        const model = models[modelName];
        const record = await fakeRecord();

        // act
        const plan = createImportPlan(model);
        await executeImportPlan(plan, { data: record });

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
        await executeImportPlan(plan, { data: newRecord });

        // assert
        const dbRecord = await model.findByPk(oldRecord.id);
        expect(dbRecord).toMatchObject(newRecord);
      });

      it.todo('deletes tombstones');
    });
  });
});
