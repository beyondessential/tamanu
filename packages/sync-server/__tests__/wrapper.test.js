import { v4 as uuidv4 } from 'uuid';
import { initDatabase, closeDatabase } from 'sync-server/app/database';
import { REFERENCE_TYPES } from 'shared/constants';
import {
  fakeAdministeredVaccine,
  fakeEncounter,
  fakePatient,
  fakeProgram,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeScheduledVaccine,
  fakeStringFields,
  fakeSurvey,
  fakeSurveyResponse,
  fakeSurveyResponseAnswer,
  fakeSurveyScreenComponent,
  fakeUser,
} from './fake';

import { withDate } from './utilities';

const buildEncounter = (ctx, patientId) => async () => {
  const patient = fakePatient();
  patient.data.id = patientId;
  await ctx.wrapper.insert('patient', patient);

  const examiner = fakeUser('examiner');
  await ctx.wrapper.insert('user', examiner);

  const location = fakeReferenceData('location');
  await ctx.wrapper.insert('reference', location);

  const department = fakeReferenceData('department');
  await ctx.wrapper.insert('reference', department);

  const encounter = fakeEncounter();
  encounter.data.patientId = patient.data.id;
  encounter.data.examinerId = examiner.data.id;
  encounter.data.locationId = location.data.id;
  encounter.data.departmentId = department.data.id;

  return encounter;
};

const buildAdministeredVaccine = (ctx, patientId) => async () => {
  const encounter = await buildEncounter(ctx, patientId)();
  await ctx.wrapper.insert(`patient/${patientId}/encounter`, encounter);

  const administeredVaccine = fakeAdministeredVaccine();
  administeredVaccine.data.encounterId = encounter.data.id;

  return administeredVaccine;
};

const buildSurveyResponse = (ctx, patientId) => async () => {
  const encounter = await buildEncounter(ctx, patientId)();
  await ctx.wrapper.insert(`patient/${patientId}/encounter`, encounter);

  const surveyResponse = fakeSurveyResponse();
  surveyResponse.data.encounterId = encounter.data.id;

  return surveyResponse;
};

const buildSurveyResponseAnswer = (ctx, patientId) => async () => {
  const surveyResponse = await buildSurveyResponse(ctx, patientId)();
  await ctx.wrapper.insert(`patient/${patientId}/surveyResponse`, surveyResponse);

  const surveyResponseAnswer = fakeSurveyResponseAnswer();
  surveyResponseAnswer.data.responseId = surveyResponse.data.id;

  return surveyResponseAnswer;
};

describe('wrappers', () => {
  describe('sqlWrapper', () => {
    const ctx = {};
    beforeAll(async () => {
      ctx.wrapper = (await initDatabase({ testMode: true })).store;
    });

    afterAll(closeDatabase);

    const patientId = uuidv4();
    const modelTests = [
      [`patient/${patientId}/administeredVaccine`, buildAdministeredVaccine(ctx, patientId)],
      [`patient/${patientId}/encounter`, buildEncounter(ctx, patientId)],
      [`patient/${patientId}/surveyResponse`, buildSurveyResponse(ctx, patientId)],
      [`patient/${patientId}/surveyResponseAnswer`, buildSurveyResponseAnswer(ctx, patientId)],
      ['patient', fakePatient],
      ['program', fakeProgram],
      ['programDataElement', fakeProgramDataElement],
      ['reference', fakeReferenceData],
      [
        'scheduledVaccine',
        async () => {
          const scheduledVaccine = fakeScheduledVaccine();

          const vaccineId = uuidv4();
          const vaccine = {
            data: {
              id: vaccineId,
              type: REFERENCE_TYPES.VACCINE,
              ...fakeStringFields(`vaccine_${vaccineId}_`, ['code', 'name']),
            },
          };
          await ctx.wrapper.insert('reference', vaccine);
          scheduledVaccine.data.vaccineId = vaccineId;

          return scheduledVaccine;
        },
      ],
      ['survey', fakeSurvey],
      ['surveyScreenComponent', fakeSurveyScreenComponent],
      ['user', fakeUser],
    ];

    modelTests.forEach(([channel, fakeInstance]) => {
      describe(channel, () => {
        beforeAll(async () => {
          await ctx.wrapper.unsafeRemoveAllOfChannel(channel);
        });

        it('finds no records when empty', async () => {
          const records = await ctx.wrapper.findSince(channel, 0, { limit: 10, offset: 0 });
          expect(records).toHaveLength(0);
        });

        it('finds and counts records after an insertion', async () => {
          const instance1 = await fakeInstance();
          await withDate(new Date(1980, 5, 1), async () => {
            await ctx.wrapper.insert(channel, instance1);
          });

          const instance2 = await fakeInstance();
          await withDate(new Date(1990, 5, 1), async () => {
            await ctx.wrapper.insert(channel, instance2);
          });

          const since = new Date(1985, 5, 1).valueOf();
          expect(await ctx.wrapper.findSince(channel, since)).toEqual([
            {
              ...instance2,
              createdAt: new Date(1990, 5, 1),
              updatedAt: new Date(1990, 5, 1),
              deletedAt: null,
            },
          ]);
          expect(await ctx.wrapper.countSince(channel, since)).toEqual(1);
        });

        it('marks records as deleted', async () => {
          const instance = await fakeInstance();
          instance.id = uuidv4();
          await ctx.wrapper.insert(channel, instance);

          await ctx.wrapper.markRecordDeleted(channel, instance.id);

          const instances = await ctx.wrapper.findSince(channel, 0);
          expect(instances.find(r => r.id === instance.id)).toEqual({
            ...instance,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            deletedAt: expect.any(Date),
          });
        });

        it('removes all records of a channel', async () => {
          const record = await fakeInstance();
          await ctx.wrapper.insert(channel, record);

          await ctx.wrapper.unsafeRemoveAllOfChannel(channel);

          expect(await ctx.wrapper.findSince(channel, 0)).toEqual([]);
        });
      });
    });
  });
});
