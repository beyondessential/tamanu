import { v4 as uuidv4 } from 'uuid';
import { initDatabase, closeDatabase } from 'sync-server/app/database';
import {
  fakeAdministeredVaccine,
  fakePatient,
  fakeProgram,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeSurvey,
  fakeSurveyResponse,
  fakeSurveyResponseAnswer,
  fakeSurveyScreenComponent,
  fakeUser,
} from './fake';
import { buildScheduledVaccine, buildEncounter } from './factory';

import { withDate } from './utilities';

describe('sqlWrapper', () => {
  const ctx = {};
  beforeAll(async () => {
    ctx.wrapper = (await initDatabase({ testMode: true })).store;
  });

  afterAll(closeDatabase);

  const rootTestCases = [
    ['patient', fakePatient],
    ['program', fakeProgram],
    ['programDataElement', fakeProgramDataElement],
    ['reference', fakeReferenceData],
    ['scheduledVaccine', buildScheduledVaccine(ctx)],
    ['survey', fakeSurvey],
    ['surveyScreenComponent', fakeSurveyScreenComponent],
    ['user', fakeUser],
  ];

  const patientId = uuidv4();
  const nestedPatientTestCases = [
    [`patient/${patientId}/encounter`, buildEncounter(ctx, patientId)],
  ];

  const allTestCases = [...rootTestCases, ...nestedPatientTestCases];
  describe('all channels', () => {
    allTestCases.forEach(([channel, fakeInstance]) => {
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

  describe('nested patient channels', () => {
    nestedPatientTestCases.forEach(([channel, fakeInstance]) => {
      describe(channel, () => {
        beforeAll(async () => {
          await ctx.wrapper.unsafeRemoveAllOfChannel(channel);
        });

        it('throws an error when inserting valid records nested under the wrong patient', async () => {
          const [prefix, , suffix] = channel.split('/');
          const wrongId = uuidv4();
          const wrongChannel = [prefix, wrongId, suffix].join('/');
          await expect(ctx.wrapper.insert(wrongChannel, await fakeInstance())).rejects.toThrow();
        });

        it.todo("doesn't find records for another patient");
      });
    });
  });

  describe('encounters', () => {
    const encounterChannel = `patient/${patientId}/encounter`;
    beforeAll(async () => {
      await ctx.wrapper.insert('patient', { ...fakePatient(), patientId });
    });

    beforeEach(async () => {
      await ctx.wrapper.unsafeRemoveAllOfChannel(encounterChannel);
    });

    it('finds no nested records when there are none', async () => {
      // arrange
      const encounter = await buildEncounter(ctx, patientId)();

      // act
      await ctx.wrapper.insert(encounterChannel, encounter);
      const foundEncounters = await ctx.wrapper.findSince(encounterChannel, 0);

      // assert
      expect(foundEncounters.length).toBe(1);
      const [foundEncounter] = foundEncounters;
      expect(foundEncounter).toHaveProperty('surveyResponses', []);
      expect(foundEncounter).toHaveProperty('administeredVaccines', []);
    });

    it.skip('finds and counts nested records', async () => {
      // arrange
      const encounter = await buildEncounter(ctx, patientId)();

      const administeredVaccine = fakeAdministeredVaccine().data;
      delete administeredVaccine.encounterId;
      encounter.data.administeredVaccines = [administeredVaccine];

      const surveyResponse = fakeSurveyResponse().data;
      delete surveyResponse.encounterId;
      encounter.data.surveyResponses = [surveyResponse];

      const surveyResponseAnswer = fakeSurveyResponseAnswer().data;
      delete surveyResponseAnswer.responseId;
      surveyResponse.answers = [surveyResponseAnswer];

      // act
      await ctx.wrapper.insert(encounterChannel, encounter);
      const foundEncounters = await ctx.wrapper.findSince(encounterChannel, 0);

      // assert
      expect(foundEncounters.length).toBe(1);
      const [foundEncounter] = foundEncounters;
      expect(foundEncounter).toBe(encounter);
    });

    it.todo('marks related objects as deleted');
    it.todo('deletes related objects');
  });
});
