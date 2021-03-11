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

const withoutArrays = record =>
  Object.entries(record).reduce((memo, [k, v]) => {
    if (Array.isArray(v)) {
      return memo;
    }
    return { ...memo, [k]: v };
  }, {});

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
    [
      `patient/${patientId}/encounter`,
      async () => withoutArrays(await buildEncounter(ctx, patientId)),
    ],
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
});
