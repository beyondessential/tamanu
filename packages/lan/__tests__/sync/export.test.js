// TODO: add tests to shared-src and move this file there

import { v4 as uuidv4 } from 'uuid';
import { subDays, format } from 'date-fns';
import { buildNestedEncounter, fake, fakePatient, upsertAssociations } from 'shared/test-helpers';
import { createExportPlan, executeExportPlan } from 'shared/models/sync';
import { createTestContext, unsafeSetUpdatedAt } from '../utilities';

const makeDate = daysAgo => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd hh:mm:ss.SSS +00:00');

const expectDeepMatch = (dbRecord, syncRecord) => {
  Object.keys(dbRecord).forEach(field => {
    if (Array.isArray(dbRecord[field])) {
      // iterate over relation fields
      expect(syncRecord.data).toHaveProperty(`${field}.length`);
      dbRecord[field].forEach(childDbRecord => {
        const childSyncRecord = syncRecord.data[field].find(r => r.data.id === childDbRecord.id);
        expect(childSyncRecord).toBeDefined();
        expectDeepMatch(childDbRecord, childSyncRecord);
      });
    } else if (dbRecord[field] instanceof Date) {
      expect(syncRecord.data).toHaveProperty(field, dbRecord[field].toISOString());
    } else {
      expect(syncRecord.data).toHaveProperty(field, dbRecord[field]);
    }
  });
};

describe('export', () => {
  let models;
  let context;
  const patientId = uuidv4();
  beforeAll(async () => {
    context = await createTestContext();
    models = context.models;
    await models.Patient.create({ ...fakePatient(), id: patientId });
  });

  const testCases = [
    ['Patient', fakePatient],
    [
      'Encounter',
      async () => buildNestedEncounter(context, patientId),
      `patient/${patientId}/encounter`,
    ],
    [
      'PatientAllergy',
      () => ({ ...fake(models.PatientAllergy), patientId }),
      `patient/${patientId}/allergy`,
    ],
    [
      'PatientCarePlan',
      () => ({ ...fake(models.PatientCarePlan), patientId }),
      `patient/${patientId}/carePlan`,
    ],
    [
      'PatientCondition',
      () => ({ ...fake(models.PatientCondition), patientId }),
      `patient/${patientId}/condition`,
    ],
    [
      'PatientFamilyHistory',
      () => ({ ...fake(models.PatientFamilyHistory), patientId }),
      `patient/${patientId}/familyHistory`,
    ],
    [
      'PatientIssue',
      () => ({ ...fake(models.PatientIssue), patientId }),
      `patient/${patientId}/issue`,
    ],
  ];
  testCases.forEach(([modelName, fakeRecord, overrideChannel]) => {
    describe(modelName, () => {
      it('exports pages of records', async () => {
        // arrange
        const model = models[modelName];
        const channel = overrideChannel || (await model.getChannels())[0];
        const plan = createExportPlan(model);
        await model.truncate();
        const records = [await fakeRecord(), await fakeRecord()];
        const updatedAts = [makeDate(20), makeDate(0)];
        await Promise.all(
          records.map(async (record, i) => {
            await model.create(record);
            await upsertAssociations(model, record);
            await unsafeSetUpdatedAt(context.sequelize, {
              table: model.tableName,
              id: record.id,
              updated_at: updatedAts[i],
            });
          }),
        );

        // act
        const { records: firstRecords, cursor: firstCursor } = await executeExportPlan(
          plan,
          channel,
          { limit: 1 },
        );
        const { records: secondRecords, cursor: secondCursor } = await executeExportPlan(
          plan,
          channel,
          {
            limit: 1,
            since: firstCursor,
          },
        );
        const { records: thirdRecords } = await executeExportPlan(plan, channel, {
          limit: 1,
          since: secondCursor,
        });

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
