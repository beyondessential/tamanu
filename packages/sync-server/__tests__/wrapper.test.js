import { v4 as uuidv4 } from 'uuid';
import { omit } from 'lodash';
import { initDatabase, closeDatabase } from 'sync-server/app/database';
import {
  fakeProgram,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeSurvey,
  fakeSurveyScreenComponent,
  fakeUser,
  fake,
  buildScheduledVaccine,
  buildEncounter,
} from 'shared/test-helpers';
import { REFERENCE_TYPES } from 'shared/constants';

import { withDate } from './utilities';

const withoutArrays = record =>
  Object.entries(record).reduce((memo, [k, v]) => {
    if (Array.isArray(v)) {
      return memo;
    }
    return { ...memo, [k]: v };
  }, {});

describe('sqlWrapper', () => {
  let store = null;
  beforeAll(async () => {
    store = await initDatabase({ testMode: true });
  });

  afterAll(closeDatabase);

  const userId = uuidv4();
  const rootTestCases = [
    ['patient', () => fake(store.models.Patient)],
    ['program', fakeProgram],
    ['programDataElement', fakeProgramDataElement],
    ['reference', fakeReferenceData],
    ['scheduledVaccine', () => buildScheduledVaccine(store.models)],
    ['survey', fakeSurvey],
    ['surveyScreenComponent', fakeSurveyScreenComponent],
    ['user', fakeUser],
    [
      'labTestType',
      async () => {
        const category = await store.models.ReferenceData.create({
          ...fake(store.models.ReferenceData),
          type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
        });
        return {
          ...fake(store.models.LabTestType),
          labTestCategoryId: category.id,
        };
      },
    ],
    [
      'reportRequest',
      async () => {
        const existingUser = await store.models.User.findByPk(userId);
        if (!existingUser) {
          await store.models.User.create({ ...fakeUser(), id: userId });
        }
        return { ...fake(store.models.ReportRequest), requestedByUserId: userId };
      },
    ],
  ];

  const patientId = uuidv4();
  beforeAll(async () => {
    const { Patient } = store.models;
    await Patient.create({ ...fake(Patient), id: patientId });
  });

  const nestedPatientTestCases = [
    [
      `patient/${patientId}/encounter`,
      async () => withoutArrays(await buildEncounter(store.models, patientId)),
    ],
    [`patient/${patientId}/allergy`, () => ({ ...fake(store.models.PatientAllergy), patientId })],
    [`patient/${patientId}/carePlan`, () => ({ ...fake(store.models.PatientCarePlan), patientId })],
    [
      `patient/${patientId}/condition`,
      () => ({ ...fake(store.models.PatientCondition), patientId }),
    ],
    [
      `patient/${patientId}/familyHistory`,
      () => ({ ...fake(store.models.PatientFamilyHistory), patientId }),
    ],
    [`patient/${patientId}/issue`, () => ({ ...fake(store.models.PatientIssue), patientId })],
  ];

  const allTestCases = [...rootTestCases, ...nestedPatientTestCases];
  describe('all channels', () => {
    allTestCases.forEach(([channel, fakeInstance]) => {
      describe(channel, () => {
        beforeAll(async () => {
          await store.sequelize.channelRouter(channel, model =>
            model.destroy({ where: {}, force: true }),
          );
        });

        it('counts no records when empty', async () => {
          expect(await store.countSince(channel, '0')).toEqual(0);
        });

        it('counts records after an insertion', async () => {
          const instance1 = await fakeInstance();
          await withDate(new Date(1980, 5, 1), async () => {
            await store.sequelize.channelRouter(channel, model => model.upsert(instance1));
          });

          const instance2 = await fakeInstance();
          await withDate(new Date(1990, 5, 1), async () => {
            await store.sequelize.channelRouter(channel, model => model.upsert(instance2));
          });

          const since = new Date(1985, 5, 1).valueOf().toString();
          expect(await store.countSince(channel, since)).toEqual(1);
        });

        it('marks records as deleted', async () => {
          const instance = await fakeInstance();
          instance.id = uuidv4();
          await store.sequelize.channelRouter(channel, model => model.upsert(instance));

          await store.markRecordDeleted(channel, instance.id);

          const instances = await store.sequelize.channelRouter(channel, model =>
            model.findAll({ paranoid: false }),
          );
          expect(
            omit(instances.find(r => r.id === instance.id).get({ plain: true }), [
              'markedForPush',
              'markedForSync',
            ]),
          ).toEqual({
            ...instance,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            deletedAt: expect.any(Date),
          });
        });
      });
    });
  });
});
