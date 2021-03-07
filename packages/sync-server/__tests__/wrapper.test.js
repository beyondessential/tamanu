import { v4 as uuidv4 } from 'uuid';
import { initDatabase, closeDatabase } from 'sync-server/app/database';
import {
  fakePatient,
  fakeProgram,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeSurvey,
  fakeSurveyScreenComponent,
  fakeUser,
  buildScheduledVaccine,
  buildEncounter,
  buildNestedEncounter,
} from 'shared/test-helpers';

import { withDate } from './utilities';

describe('sqlWrapper', () => {
  let ctx = null;
  beforeAll(async () => {
    ctx = (await initDatabase({ testMode: true })).store;
  });

  afterAll(closeDatabase);

  const rootTestCases = [
    ['patient', fakePatient],
    ['program', fakeProgram],
    ['programDataElement', fakeProgramDataElement],
    ['reference', fakeReferenceData],
    ['scheduledVaccine', () => buildScheduledVaccine(ctx)],
    ['survey', fakeSurvey],
    ['surveyScreenComponent', fakeSurveyScreenComponent],
    ['user', fakeUser],
  ];

  const patientId = uuidv4();
  const nestedPatientTestCases = [
    [`patient/${patientId}/encounter`, () => buildEncounter(ctx, patientId)],
  ];

  const allTestCases = [...rootTestCases, ...nestedPatientTestCases];
  describe('all channels', () => {
    allTestCases.forEach(([channel, fakeInstance]) => {
      describe(channel, () => {
        beforeAll(async () => {
          await ctx.unsafeRemoveAllOfChannel(channel);
        });

        it('finds no records when empty', async () => {
          const records = await ctx.findSince(channel, 0, { limit: 10, offset: 0 });
          expect(records).toHaveLength(0);
        });

        it('finds and counts records after an insertion', async () => {
          const instance1 = await fakeInstance();
          await withDate(new Date(1980, 5, 1), async () => {
            await ctx.upsert(channel, instance1);
          });

          const instance2 = await fakeInstance();
          await withDate(new Date(1990, 5, 1), async () => {
            await ctx.upsert(channel, instance2);
          });

          const since = new Date(1985, 5, 1).valueOf();
          expect(await ctx.findSince(channel, since)).toEqual([
            {
              ...instance2,
              createdAt: new Date(1990, 5, 1),
              updatedAt: new Date(1990, 5, 1),
              deletedAt: null,
            },
          ]);
          expect(await ctx.countSince(channel, since)).toEqual(1);
        });

        it('marks records as deleted', async () => {
          const instance = await fakeInstance();
          instance.id = uuidv4();
          await ctx.upsert(channel, instance);

          await ctx.markRecordDeleted(channel, instance.id);

          const instances = await ctx.findSince(channel, 0);
          expect(instances.find(r => r.id === instance.id)).toEqual({
            ...instance,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            deletedAt: expect.any(Date),
          });
        });

        it('removes all records of a channel', async () => {
          const record = await fakeInstance();
          await ctx.upsert(channel, record);

          await ctx.unsafeRemoveAllOfChannel(channel);

          expect(await ctx.findSince(channel, 0)).toEqual([]);
        });
      });
    });
  });

  describe('nested patient channels', () => {
    nestedPatientTestCases.forEach(([channel, fakeInstance]) => {
      describe(channel, () => {
        beforeAll(async () => {
          await ctx.unsafeRemoveAllOfChannel(channel);
        });

        it('throws an error when inserting valid records nested under the wrong patient', async () => {
          const [prefix, , suffix] = channel.split('/');
          const wrongId = uuidv4();
          const wrongChannel = [prefix, wrongId, suffix].join('/');
          await expect(ctx.upsert(wrongChannel, await fakeInstance())).rejects.toThrow();
        });
      });
    });
  });

  describe('encounters', () => {
    const encounterChannel = `patient/${patientId}/encounter`;
    beforeAll(async () => {
      await ctx.upsert('patient', { ...fakePatient(), patientId });
    });

    beforeEach(async () => {
      await ctx.unsafeRemoveAllOfChannel(encounterChannel);
    });

    it('finds no nested records when there are none', async () => {
      // arrange
      const encounter = await buildEncounter(ctx, patientId);

      // act
      await ctx.upsert(encounterChannel, encounter);
      const foundEncounters = await ctx.findSince(encounterChannel, 0);

      // assert
      expect(foundEncounters.length).toBe(1);
      const [foundEncounter] = foundEncounters;
      expect(foundEncounter).toHaveProperty('surveyResponses', []);
      expect(foundEncounter).toHaveProperty('administeredVaccines', []);
    });

    it('finds and counts nested records', async () => {
      // arrange
      const encounter = await buildNestedEncounter(ctx, patientId);

      const otherPatientId = uuidv4(); // add another encounter to test nested record isolation
      const otherEncounter = await buildNestedEncounter(ctx, otherPatientId);
      await ctx.upsert(`patient/${otherPatientId}/encounter`, otherEncounter);

      // act
      await ctx.upsert(encounterChannel, encounter);
      const foundEncounters = await ctx.findSince(encounterChannel, 0);

      // assert
      expect(foundEncounters.length).toBe(1);

      const [foundEncounter] = foundEncounters;
      const timestamps = {
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
      };
      expect(foundEncounter).toEqual({
        ...encounter,
        ...timestamps,
        administeredVaccines: [
          {
            ...encounter.administeredVaccines[0],
            ...timestamps,
            encounterId: encounter.id,
          },
        ],
        surveyResponses: [
          {
            ...encounter.surveyResponses[0],
            ...timestamps,
            encounterId: encounter.id,
            answers: [
              {
                ...encounter.surveyResponses[0].answers[0],
                ...timestamps,
                responseId: expect.anything(),
              },
            ],
          },
        ],
      });
      const [foundSurveyResponse] = foundEncounter.surveyResponses;
      expect(foundSurveyResponse.answers[0].responseId).toEqual(foundSurveyResponse.id);
    });

    it('marks related objects as deleted', async () => {
      // arrange
      const encounter = await buildNestedEncounter(ctx, patientId);
      await ctx.upsert(encounterChannel, encounter);

      // act
      await ctx.markRecordDeleted(encounterChannel, encounter.id);

      // assert
      const [foundEncounter] = await ctx.findSince(encounterChannel, 0);
      expect(foundEncounter).toHaveProperty('deletedAt', expect.any(Date));
      expect(foundEncounter).toHaveProperty(
        ['administeredVaccines', 0, 'deletedAt'],
        expect.any(Date),
      );
      expect(foundEncounter).toHaveProperty(['surveyResponses', 0, 'deletedAt'], expect.any(Date));
      expect(foundEncounter).toHaveProperty(
        ['surveyResponses', 0, 'answers', 0, 'deletedAt'],
        expect.any(Date),
      );
    });

    it('inserts an encounter without nested relationships', async () => {
      // arrange
      const encounter = await buildEncounter(ctx, patientId);
      encounter.surveyResponses = null;
      encounter.administeredVaccines = null;

      // act
      await ctx.upsert(encounterChannel, encounter);
      const foundEncounters = await ctx.findSince(encounterChannel, 0);

      // assert
      expect(foundEncounters.length).toBe(1);

      const [foundEncounter] = foundEncounters;
      const timestamps = {
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
      };
      expect(foundEncounter).toEqual({
        ...encounter,
        ...timestamps,
        administeredVaccines: [],
        surveyResponses: [],
      });
    });
  });
});
