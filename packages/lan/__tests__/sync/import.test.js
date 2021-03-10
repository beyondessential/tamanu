// TODO: add tests to shared-src and move this file there

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
import { createImportPlan, executeImportPlan } from 'shared/models/sync';
import { createTestContext } from '../utilities';

// converts a db record and all its relations to a sync record
const toSyncRecord = record => ({
  data: Object.entries(record).reduce((data, [k, oldVal]) => {
    let val = oldVal;
    if (Array.isArray(val)) {
      val = val.map(r => toSyncRecord(r));
    } else if (val instanceof Date) {
      val = val.toISOString();
    }
    return { ...data, [k]: val };
  }, {}),
});

describe('import', () => {
  let models;
  let context;
  let sharedPatient = null;
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
    [
      'Encounter',
      async () => {
        sharedPatient = sharedPatient || (await context.models.Patient.create(fakePatient()));
        return buildNestedEncounter(context, sharedPatient.id);
      },
      {
        include: [
          { association: 'administeredVaccines' },
          {
            association: 'surveyResponses',
            include: [{ association: 'answers' }],
          },
        ],
      },
      ({ patientId }) => `patient/${patientId}/encounter`,
    ],
  ];
  rootTestCases.forEach(([modelName, fakeRecord, options = {}, overrideChannel = null]) => {
    describe(modelName, () => {
      it('creates the record', async () => {
        // arrange
        const model = models[modelName];
        const record = await fakeRecord();
        const channel = overrideChannel
          ? await overrideChannel(record)
          : (await model.channels())[0];

        // act
        const plan = createImportPlan(model, channel);
        await executeImportPlan(plan, toSyncRecord(record));

        // assert
        const dbRecord = await model.findByPk(record.id, options);
        expect(dbRecord.dataValues).toMatchObject(record);
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
        const channel = overrideChannel
          ? await overrideChannel(oldRecord)
          : (await model.channels())[0];

        // act
        const plan = createImportPlan(model, channel);
        await executeImportPlan(plan, toSyncRecord(newRecord));

        // assert
        const dbRecord = await model.findByPk(oldRecord.id, options);
        expect(dbRecord.dataValues).toMatchObject(newRecord);
      });

      it('deletes tombstones', async () => {
        // arrange
        const model = models[modelName];
        const record = await fakeRecord();
        await model.create(record);
        const channel = overrideChannel
          ? await overrideChannel(record)
          : (await model.channels())[0];

        // act
        const plan = createImportPlan(model, channel);
        await executeImportPlan(plan, { ...toSyncRecord(record), isDeleted: true });

        // assert
        const dbRecord = await model.findByPk(record.id, options);
        expect(dbRecord).toEqual(null);
      });
    });
  });
});
