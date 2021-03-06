import { fakePatient } from 'shared/test-helpers';
import { createExportPlan, executeExportPlan } from '~/sync/export';
import { createTestContext } from '../utilities';

describe('export', () => {
  let models;
  let context;
  beforeAll(async () => {
    context = await createTestContext();
    models = context.models;
  });

  const testCases = [['Patient', fakePatient]];
  testCases.forEach(([modelName, fakeRecord]) => {
    describe(modelName, () => {
      it('exports pages of records', async () => {
        // arrange
        const model = models[modelName];
        const plan = createExportPlan(model);
        const records = [fakeRecord(), fakeRecord()].sort((r1, r2) => r1.id.localeCompare(r2.id));
        await model.truncate();
        await Promise.all(records.map(record => model.create(record)));

        // act
        const firstRecords = await executeExportPlan(plan, { limit: 1 });
        const secondRecords = await executeExportPlan(plan, { limit: 1, after: firstRecords[0] });
        const thirdRecords = await executeExportPlan(plan, { limit: 1, after: secondRecords[0] });

        // assert
        expect(firstRecords.length).toEqual(1);
        expect(firstRecords[0].data).toMatchObject(records[0]);
        expect(secondRecords.length).toEqual(1);
        expect(secondRecords[0].data).toMatchObject(records[1]);
        expect(thirdRecords.length).toEqual(0);
      });
    });
  });
});
