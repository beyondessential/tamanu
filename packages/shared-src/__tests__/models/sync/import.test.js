import { v4 as uuidv4 } from 'uuid';
import {
  fakePatient,
  fakeProgram,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeSurvey,
  fakeSurveyScreenComponent,
  fakeUser,
  fake,
  buildScheduledVaccine,
  buildNestedEncounter,
} from 'shared/test-helpers';
import { createImportPlan, executeImportPlan } from 'shared/models/sync';
import { REFERENCE_TYPES } from 'shared/constants';
import { initDb } from '../../initDb';

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
  const patientId = uuidv4();
  beforeAll(async () => {
    context = await initDb({ syncClientMode: true }); // TODO: test server mode too
    models = context.models;
    await models.Patient.create({ ...fakePatient(), id: patientId });
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
      async () => buildNestedEncounter(context, patientId),
      `patient/${patientId}/encounter`,
      {
        include: [
          { association: 'administeredVaccines' },
          { association: 'diagnoses' },
          { association: 'medications' },
          {
            association: 'surveyResponses',
            include: [{ association: 'answers' }],
          },
          {
            association: 'labRequests',
            include: [{ association: 'tests' }],
          },
          { association: 'imagingRequests' },
        ],
      },
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
    [
      'LabTestType',
      async () => {
        const labTestCategory = {
          ...fake(models.ReferenceData),
          type: REFERENCE_TYPES.LAB_TEST_TYPE,
        };
        await models.ReferenceData.create(labTestCategory);
        return { ...fake(models.LabTestType), labTestCategoryId: labTestCategory.id };
      },
    ],
  ];

  rootTestCases.forEach(([modelName, fakeRecord, overrideChannel = null, options = {}]) => {
    describe(modelName, () => {
      it('creates the record', async () => {
        // arrange
        const model = models[modelName];
        const record = await fakeRecord();
        const channel = overrideChannel || (await model.getChannels())[0];

        // act
        const plan = createImportPlan(model);
        await executeImportPlan(plan, channel, toSyncRecord(record));

        // assert
        const dbRecord = await model.findByPk(record.id, options);
        expect(dbRecord.get({ plain: true })).toMatchObject({
          ...record,
          ...(model.tableAttributes.pushedAt ? { pulledAt: expect.any(Date) } : {}),
        });
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
        const channel = overrideChannel || (await model.getChannels())[0];

        // act
        const plan = createImportPlan(model);
        await executeImportPlan(plan, channel, toSyncRecord(newRecord));

        // assert
        const dbRecord = await model.findByPk(oldRecord.id, options);
        expect(dbRecord.get({ plain: true })).toMatchObject({
          ...newRecord,
          ...(model.tableAttributes.pushedAt ? { pulledAt: expect.any(Date) } : {}),
        });
      });

      it('deletes tombstones', async () => {
        // arrange
        const model = models[modelName];
        const record = await fakeRecord();
        await model.create(record);
        const channel = overrideChannel || (await model.getChannels())[0];

        // act
        const plan = createImportPlan(model);
        await executeImportPlan(plan, channel, { ...toSyncRecord(record), isDeleted: true });

        // assert
        const dbRecord = await model.findByPk(record.id, options);
        expect(dbRecord).toEqual(null);
      });
    });
  });
});
