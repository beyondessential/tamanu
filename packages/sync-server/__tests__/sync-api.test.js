import { createTestContext } from './utilities';
import { subDays, subHours } from 'date-fns';

const { baseApp, store } = createTestContext();

const makeDate = (daysAgo, hoursAgo=0) => {
  return subHours(subDays(new Date(), daysAgo), hoursAgo).valueOf();
};

const OLDEST = makeDate(20);
const SECOND_OLDEST = makeDate(10);

const RECORDS = [
  { lastSynced: OLDEST, data: { dataKey: 'first' } },
  { lastSynced: SECOND_OLDEST, data: { dataKey: 'second' } },
];

describe("Sync API", () => {

  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');

    await Promise.all(RECORDS.map(r => store.insert('testChannel', {
      recordType: 'test',
      ...r,
    })));
  });

  describe("Reads", () => {
    
    it('should error if no since parameter is provided', async () => {
      const result = await app.get('/testChannel');
      expect(result).toHaveRequestError();
    });

    it('should get some records', async () => {
      const result = await app.get(`/testChannel?since=${OLDEST-1}`);
      expect(result).toHaveSucceeded();
      
      const { body } = result;
      expect(body.count).toBeGreaterThan(0);
      expect(body).toHaveProperty('records');
      expect(body).toHaveProperty('requestedAt');
      expect(body.records.length).toBeGreaterThan(0);

      const firstRecord = body.records[0];
      expect(firstRecord).toHaveProperty('recordType');
      expect(firstRecord).toHaveProperty('lastSynced', OLDEST);
      expect(firstRecord).toHaveProperty('data');
      expect(firstRecord).not.toHaveProperty('channel');
      expect(firstRecord.data).not.toHaveProperty('channel');
      expect(firstRecord.data).toHaveProperty('id');
    });

    it('should filter out older records', async () => {
      const result = await app.get(`/testChannel?since=${SECOND_OLDEST-1}`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      const firstRecord = body.records[0];
      expect(firstRecord).toHaveProperty('lastSynced', SECOND_OLDEST);
    });

    test.todo('should only return $limit records');
    test.todo('should return a second page of records');
  });

  describe("Writes", () => {

    beforeAll(async () => {
      await store.remove({ recordType: 'test-write' });
    });

    it('should add a record to a channel', async () => {
      const precheck = await store.findSince('adder', 0);
      expect(precheck).toHaveProperty('length', 0);

      const result = await app.post('/adder').send({
        recordType: 'test-write',
        data: {
          id: 'adder0',
          dataValue: 'add',
        }
      });
      expect(result).toHaveSucceeded();

      const postcheck = await store.findSince('adder', 0);
      expect(postcheck.length).toEqual(1);
    });

    it('should add multiple records to reference data', async () => {
      const precheck = await store.findSince('adder', 0);
      expect(precheck.length).toEqual(1);

      const result = await app.post('/adder').send([
        {
          recordType: 'test-write',
          data: { id: 'adder1', dataValue: 'add1' }
        },
        {
          recordType: 'test-write',
          data: { id: 'adder2', dataValue: 'add2' }
        },
      ]);
      expect(result).toHaveSucceeded();

      const postcheck = await store.findSince('adder', 0);
      expect(postcheck.length).toEqual(3);
    });

    it('should update an existing record in reference data', async () => {
      const result = await app.post('/adder').send({
        recordType: 'test-write',
        data: { id: 'adder1', dataValue: 'add1-updated' }
      });

      expect(result).toHaveSucceeded();

      const records = await store.findSince('adder', 0);
      const adder1Record = records.find(x => x.data.id === 'adder1');
      expect(adder1Record).toBeDefined();
      expect(adder1Record).toHaveProperty('data.dataValue', 'add1-updated');
    });
  });

});

