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
  describe('in client mode', () => {
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

    rootTestCases.forEach(([modelName, fakeRecord, overrideChannel = null, options = {}]) => {
      describe(modelName, () => {
        it('creates the record', async () => {
          // arrange
          const model = models[modelName];
          const record = await fakeRecord();
          const channel = overrideChannel || (await model.getChannels())[0];

          // act
          const plan = createImportPlan(model);
          await executeImportPlan(plan, channel, [toSyncRecord(record)]);

          // assert
          const dbRecord = await model.findByPk(record.id, options);
          expect(dbRecord.get({ plain: true })).toMatchObject({
            ...record,
            ...(model.tableAttributes.pushedAt
              ? { pulledAt: expect.any(Date), markedForPush: false }
              : {}),
          });
        });

        it('updates the record', async () => {
          // arrange
          const model = models[modelName];
          const isPushable = !!model.tableAttributes.pushedAt;
          const oldRecord = await fakeRecord();
          await model.create(oldRecord);
          if (isPushable) {
            // the newly created record should have markedForPush set to true initially
            await expect(model.findByPk(oldRecord.id)).resolves.toHaveProperty(
              'markedForPush',
              true,
            );
          }
          const newRecord = {
            ...(await fakeRecord()),
            id: oldRecord.id,
          };
          const channel = overrideChannel || (await model.getChannels())[0];

          // act
          const plan = createImportPlan(model);
          await executeImportPlan(plan, channel, [toSyncRecord(newRecord)]);

          // assert
          const dbRecord = await model.findByPk(oldRecord.id, { ...options, plain: true });
          expect(dbRecord).toMatchObject(newRecord);
          if (isPushable) {
            expect(dbRecord.pulledAt).toEqual(expect.any(Date));
            // even if there were pending changes, they will have been overwritten by the import
            // from the server, so should change markedForPush status to false
            expect(dbRecord.markedForPush).toEqual(false);
          }
        });

        it('deletes tombstones', async () => {
          // arrange
          const model = models[modelName];
          const record = await fakeRecord();
          await model.create(record);
          const channel = overrideChannel || (await model.getChannels())[0];

          // act
          const plan = createImportPlan(model);
          await executeImportPlan(plan, channel, [{ ...toSyncRecord(record), isDeleted: true }]);

          // assert
          const dbRecord = await model.findByPk(record.id, options);
          expect(dbRecord).toEqual(null);
        });
      });
    });
  });

  describe('in server mode', () => {
    let models;
    beforeAll(async () => {
      const context = await initDb({ syncClientMode: false });
      models = context.models;
    });

    it('removes null or undefined fields when importing', async () => {
      // arrange
      const { Patient } = models;
      const oldPatient = await fake(Patient);
      const newPatient = {
        ...(await fake(Patient)),
        firstName: null,
        id: oldPatient.id,
      };
      await Patient.create(oldPatient);
      const channel = 'patient';

      // act
      const plan = createImportPlan(Patient);
      await executeImportPlan(plan, channel, [toSyncRecord(newPatient)]);

      // assert
      const dbPatient = await Patient.findByPk(oldPatient.id);
      expect(dbPatient.get({ plain: true })).toMatchObject({
        ...newPatient,
        firstName: oldPatient.firstName,
        ...(Patient.tableAttributes.pushedAt ? { pulledAt: expect.any(Date) } : {}),
      });
    });
  });
});
