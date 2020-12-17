import { MongoWrapper } from 'sync-server/app/database/mongoWrapper';
import { initDatabase } from 'sync-server/app/database';
import { v4 as uuidv4 } from 'uuid';
import { fakePatient } from './fake';
import { withDate } from './utilities';

describe('wrappers', () => {
  [
    // TODO: temporarily hardcode config until this gets removed
    ['mongoWrapper', async () => new MongoWrapper('mongodb://localhost', 'tamanu-sync-test', true)],
    ['postgresWrapper', async () => initDatabase().store],
  ].forEach(([name, build]) => {
    const removeFunctionName =
      name === 'mongoWrapper' ? 'removeAllOfType' : 'unsafeRemoveAllOfChannel';

    describe(name, () => {
      let wrapper;
      beforeAll(async () => {
        wrapper = await build();
        await wrapper[removeFunctionName]('patient');
        return wrapper;
      });

      afterAll(async () => {
        wrapper.close();
      });

      it('finds no records when empty', async () => {
        const records = await wrapper.findSince('patient', 0, { limit: 10, offset: 0 });
        expect(records).toHaveLength(0);
      });

      it('finds and counts records after an insertion', async () => {
        const patient1 = fakePatient();
        await withDate(new Date(1980, 5, 1), async () => {
          await wrapper.insert('patient', patient1);
        });

        const patient2 = fakePatient();
        await withDate(new Date(1990, 5, 1), async () => {
          await wrapper.insert('patient', patient2);
        });

        const since = new Date(1985, 5, 1).valueOf();
        expect(await wrapper.findSince('patient', since)).toEqual([
          {
            lastSynced: new Date(1990, 5, 1).valueOf(),
            ...patient2,
            data: {
              id: expect.anything(),
              ...patient2.data,
            },
          },
        ]);
        expect(await wrapper.countSince('patient', since)).toEqual(1);
      });

      it('marks records as deleted', async () => {
        const patient = fakePatient();
        patient.data.id = uuidv4();
        await wrapper.insert('patient', patient);

        await wrapper.markRecordDeleted('patient', patient.data.id);

        const patients = await wrapper.findSince('patient', 0);
        expect(patients.find(r => r.data.id === patient.data.id)).toEqual({
          data: { id: patient.data.id },
          lastSynced: expect.anything(),
          isDeleted: true,
        });
      });

      it('removes all records of a channel', async () => {
        const record = fakePatient();
        await wrapper.insert('patient', record);

        await wrapper[removeFunctionName]('patient');

        expect(await wrapper.findSince('patient', 0)).toEqual([]);
      });
    });
  });
});
