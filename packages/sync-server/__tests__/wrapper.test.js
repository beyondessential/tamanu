import { v4 as uuidv4 } from 'uuid';
import { initDatabase, closeDatabase } from 'sync-server/app/database';
import { fakePatient, fakeSurvey, fakeScheduledVaccine, fakeSurveyScreenComponent } from './fake';
import { withDate } from './utilities';

describe('wrappers', () => {
  describe('sqlWrapper', () => {
    let wrapper;
    beforeAll(async () => {
      wrapper = (await initDatabase({ testMode: true })).store;
    });

    afterAll(closeDatabase);

    [
      ['patient', () => fakePatient],
      ['survey/survey', () => fakeSurvey],
      ['survey/surveyScreenComponent', () => fakeSurveyScreenComponent],
      ['vaccination/scheduledVaccine', () => fakeScheduledVaccine(wrapper)],
    ].forEach(([channel, buildFakeInstance]) => {
      describe(channel, () => {
        let fakeInstance;

        beforeAll(async () => {
          await wrapper.unsafeRemoveAllOfChannel(channel);
          fakeInstance = await buildFakeInstance();
        });

        it('finds no records when empty', async () => {
          const records = await wrapper.findSince(channel, 0, { limit: 10, offset: 0 });
          expect(records).toHaveLength(0);
        });

        it('finds and counts records after an insertion', async () => {
          const instance1 = fakeInstance();
          await withDate(new Date(1980, 5, 1), async () => {
            await wrapper.insert(channel, instance1);
          });

          const instance2 = fakeInstance();
          await withDate(new Date(1990, 5, 1), async () => {
            await wrapper.insert(channel, instance2);
          });

          const since = new Date(1985, 5, 1).valueOf();
          expect(await wrapper.findSince(channel, since)).toEqual([
            {
              lastSynced: new Date(1990, 5, 1).valueOf(),
              ...instance2,
            },
          ]);
          expect(await wrapper.countSince(channel, since)).toEqual(1);
        });

        it('marks records as deleted', async () => {
          const instance = fakeInstance();
          instance.data.id = uuidv4();
          await wrapper.insert(channel, instance);

          await wrapper.markRecordDeleted(channel, instance.data.id);

          const instances = await wrapper.findSince(channel, 0);
          expect(instances.find(r => r.data.id === instance.data.id)).toEqual({
            data: { id: instance.data.id },
            lastSynced: expect.anything(),
            isDeleted: true,
          });
        });

        it('removes all records of a channel', async () => {
          const record = fakeInstance();
          await wrapper.insert(channel, record);

          await wrapper.unsafeRemoveAllOfChannel(channel);

          expect(await wrapper.findSince(channel, 0)).toEqual([]);
        });
      });
    });
  });
});
