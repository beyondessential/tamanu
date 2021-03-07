import { fakePatient, buildNestedEncounter } from 'shared/test-helpers';
import { createExportPlan, executeExportPlan, includeFromTree } from '~/sync/export';
import { createTestContext } from '../utilities';

const expectDeepMatch = (dbRecord, syncRecord) => {
  Object.keys(dbRecord).forEach(field => {
    if (Array.isArray(dbRecord[field])) {
      // iterate over relation fields
      expect(syncRecord.data).toHaveProperty(field, expect.any(Array));
      dbRecord[field].forEach(childDbRecord => {
        const childSyncRecord = syncRecord.data[field].find(r => r.data.id === childDbRecord.id);
        expect(childSyncRecord).toBeDefined();
        expectDeepMatch(childDbRecord, childSyncRecord);
      });
    } else {
      // perform normal equality check on non-relation fields
      expect(syncRecord.data).toHaveProperty(field, dbRecord[field]);
    }
  });
};

describe('export', () => {
  let models;
  let context;
  beforeAll(async () => {
    context = await createTestContext();
    models = context.models;
  });

  const testCases = [
    ['Patient', fakePatient],
    ['Encounter', () => buildNestedEncounter(context)],
  ];
  testCases.forEach(([modelName, fakeRecord]) => {
    describe(modelName, () => {
      it('exports pages of records', async () => {
        // arrange
        const model = models[modelName];
        const plan = createExportPlan(model);
        const records = [await fakeRecord(), await fakeRecord()].sort((r1, r2) =>
          r1.id.localeCompare(r2.id),
        );
        await model.truncate();
        await Promise.all(records.map(record => model.create(record)));

        // act
        const firstRecords = await executeExportPlan(plan, { limit: 1 });
        const secondRecords = await executeExportPlan(plan, { limit: 1, after: firstRecords[0] });
        const thirdRecords = await executeExportPlan(plan, { limit: 1, after: secondRecords[0] });

        // assert
        expect(firstRecords.length).toEqual(1);
        expectDeepMatch(records[0], firstRecords[0]);
        expect(secondRecords.length).toEqual(1);
        expectDeepMatch(records[1], secondRecords[0]);
        expect(thirdRecords.length).toEqual(0);
      });
    });
  });
});
