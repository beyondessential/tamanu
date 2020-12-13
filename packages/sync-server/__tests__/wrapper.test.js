import { MongoWrapper } from 'sync-server/app/database/mongoWrapper';
import { PostgresWrapper } from 'sync-server/app/database/postgresWrapper';
import { getUUIDGenerator } from 'sync-server/app/database/uuid';

// TODO: debug
import { Logger } from 'mongodb';
Logger.setLevel('debug');

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
    [
      'mongoWrapper',
      async () => {
        // TODO: temporarily hardcode until this gets removed
        return new MongoWrapper('mongodb://localhost', 'tamanu-sync-test', true);
      },
    ],
    [
      'postgresWrapper',
      async () => {
        return new PostgresWrapper();
      },
    ],
  ].forEach(([name, build]) => {
    describe(name, () => {
      let wrapper;
      let channel;
      beforeAll(async () => {
        wrapper = await build();
        channel = getUUIDGenerator(true)(); // TODO: might have to use a real channel for postgres
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
            data: {
              firstName: 'alice',
            },
          });
        });

        await withDate(new Date(1990, 5, 1), async () => {
          await wrapper.insert(channel, {
            data: {
              firstName: 'bob',
            },
          });
        });

        const since = new Date(1985, 5, 1).valueOf();
        expect(await wrapper.findSince(channel, since)).toEqual([
          {
            lastSynced: new Date(1990, 5, 1).valueOf(),
            data: {
              id: expect.anything(),
              firstName: 'bob',
            },
          },
        ]);
        expect(await wrapper.countSince(channel, since)).toEqual(1);
      });

      it.todo('marks records as deleted');

      it.todo('removes records');
    });
  });
});
