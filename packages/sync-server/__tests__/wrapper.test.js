import { MongoWrapper } from 'sync-server/app/database/mongoWrapper';
import { initDatabase } from 'sync-server/app/database';
import { getUUIDGenerator } from 'sync-server/app/database/uuid';

const uuidv4 = getUUIDGenerator(true);

const withDate = async (fakeDate, fn) => {
  const OldDate = global.Date;
  try {
    global.Date = class extends OldDate {
      constructor(...args) {
        if (args.length > 0) {
          return new OldDate(...args);
        }
        return fakeDate;
      }

      static now() {
        return fakeDate.valueOf();
      }
    };
    await fn();
  } finally {
    global.Date = OldDate;
  }
};

describe('wrappers', () => {
  [
    // TODO: temporarily hardcode config until this gets removed
    ['mongoWrapper', async () => new MongoWrapper('mongodb://localhost', 'tamanu-sync-test', true)],
    ['postgresWrapper', async () => initDatabase({ testMode: true }).store],
  ].forEach(([name, build]) => {
    describe(name, () => {
      const channel = 'patient';

      let wrapper;
      beforeAll(async () => {
        wrapper = await build();
        return wrapper;
      });

      afterAll(async () => {
        wrapper.close();
      });

      it('finds no records when empty', async () => {
        const records = await wrapper.findSince(channel, 0, { limit: 10, offset: 0 });
        expect(records).toHaveLength(0);
      });

      it('finds and counts records after an insertion', async () => {
        await withDate(new Date(1980, 5, 1), async () => {
          await wrapper.insert(channel, {
            recordType: 'patient',
            data: {
              firstName: 'alice',
            },
          });
        });

        await withDate(new Date(1990, 5, 1), async () => {
          await wrapper.insert(channel, {
            recordType: 'patient',
            data: {
              firstName: 'bob',
            },
          });
        });

        const since = new Date(1985, 5, 1).valueOf();
        expect(await wrapper.findSince(channel, since)).toEqual([
          {
            lastSynced: new Date(1990, 5, 1).valueOf(),
            recordType: 'patient',
            data: {
              id: expect.anything(),
              firstName: 'bob',
            },
          },
        ]);
        expect(await wrapper.countSince(channel, since)).toEqual(1);
      });

      it('marks records as deleted', async () => {
        const record = {
          recordType: 'patient',
          data: {
            id: uuidv4(),
            firstName: 'fred',
          },
        };
        await wrapper.insert(channel, record);

        await wrapper.markRecordDeleted(channel, record.data.id);

        const records = await wrapper.findSince(channel, 0);
        expect(records.find(r => r.data.id === record.data.id)).toEqual({
          data: { id: record.data.id },
          recordType: 'patient',
          lastSynced: expect.anything(),
          isDeleted: true,
        });
      });

      it('removes all records of a type', async () => {
        const record = {
          recordType: 'patient',
          data: {
            firstName: 'mary',
          },
        };
        await wrapper.insert(channel, record);

        await wrapper.removeAllOfType('patient');

        expect(await wrapper.findSince(channel, 0)).toEqual([]);
      });
    });
  });
});
