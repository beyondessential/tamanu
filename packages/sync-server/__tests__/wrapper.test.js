import { MongoWrapper } from 'sync-server/app/database/mongoWrapper';
import { PostgresWrapper } from 'sync-server/app/database/postgresWrapper';
import { getUUIDGenerator } from 'sync-server/app/database/uuid';

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

      it('finds no records when empty', async () => {
        const records = await wrapper.findSince(channel, 0, { limit: 10, offset: 0 });
        expect(records).toHaveLength(0);
      });

      it.todo('finds records after an insertion');

      it.todo('counts records after an insertion');

      it.todo('marks records as deleted');

      it.todo('removes records');
    });
  });
});
