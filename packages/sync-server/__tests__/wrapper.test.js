import { MongoWrapper } from 'sync-server/app/database/mongoWrapper';
import { PostgresWrapper } from 'sync-server/app/database/postgresWrapper';
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
        return wrapper;
      });

      beforeEach(() => {
        channel = uuidv4(); // TODO: might have to use a real channel for postgres
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

      it('marks records as deleted', async () => {
        const record = {
          data: {
            id: uuidv4(),
            firstName: 'fred',
          },
        };
        await wrapper.insert(channel, record);

        await wrapper.markRecordDeleted(channel, record.data.id);

        expect(await wrapper.findSince(channel, 0)).toEqual([
          {
            data: { id: record.data.id },
            lastSynced: expect.anything(),
            isDeleted: true,
          },
        ]);
      });

      it.todo('removes records');
    });
  });
});
