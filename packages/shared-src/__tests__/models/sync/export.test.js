import { v4 as uuidv4 } from 'uuid';
import { subDays, format } from 'date-fns';
import {
  buildNestedEncounter,
  expectDeepSyncRecordMatch,
  fake,
  fakePatient,
  fakeUser,
  unsafeSetUpdatedAt,
  upsertAssociations,
} from 'shared/test-helpers';
import { createExportPlan, executeExportPlan } from 'shared/models/sync';
import { initDb } from '../../initDb';

const makeUpdatedAt = daysAgo =>
  format(subDays(new Date(), daysAgo), 'yyyy-MM-dd hh:mm:ss.SSS +00:00');

describe('export', () => {
  let models;
  let context;
  const patientId = uuidv4();
  const userId = uuidv4();
  const facilityId = uuidv4();
  beforeAll(async () => {
    context = await initDb({ syncClientMode: true }); // TODO: test server mode too
    models = context.models;
    await models.Patient.create({ ...fakePatient(), id: patientId });
    await models.User.create({ ...fakeUser(), id: userId });
    await models.ReferenceData.create({
      type: 'facility',
      name: 'Test Facility',
      code: 'test-facility',
      id: facilityId,
    });
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
    ['ReportRequest', () => ({ ...fake(models.ReportRequest), requestedByUserId: userId })],
    [
      'Location',
      async () => {
        return { ...fake(models.Location), facilityId };
      },
    ],
    [
      'UserFacility',
      async () => {
        const user = await models.User.create(fakeUser());
        return { id: uuidv4(), userId: user.id, facilityId };
      },
    ],
  ];
  testCases.forEach(([modelName, fakeRecord, overrideChannel]) => {
    describe(modelName, () => {
      it('exports pages of records', async () => {
        // arrange
        const model = models[modelName];
        const channel = overrideChannel || (await model.getChannels())[0];
        const plan = createExportPlan(model.sequelize, channel);
        await model.truncate();
        const records = [await fakeRecord(), await fakeRecord()];
        const updatedAts = [makeUpdatedAt(20), makeUpdatedAt(0)];
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
        const { records: firstRecords, cursor: firstCursor } = await executeExportPlan(plan, {
          limit: 1,
        });
        const { records: secondRecords, cursor: secondCursor } = await executeExportPlan(plan, {
          limit: 1,
          since: firstCursor,
        });
        const { records: thirdRecords } = await executeExportPlan(plan, {
          limit: 1,
          since: secondCursor,
        });

        // assert
        expect(firstRecords.length).toEqual(1);
        expectDeepSyncRecordMatch(records[0], firstRecords[0]);
        expect(secondRecords.length).toEqual(1);
        expectDeepSyncRecordMatch(records[1], secondRecords[0]);
        expect(thirdRecords.length).toEqual(0);
      });
    });
  });
});
