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
      const result = await app.get('/v1/sync/testChannel');
      expect(result).toHaveRequestError();
    });

    it('should get some records', async () => {
      const result = await app.get(`/v1/sync/testChannel?since=${OLDEST-1}`);
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

      // this database implementation detail should be hidden 
      // from the api consumer
      expect(firstRecord).not.toHaveProperty('index'); 
    });

    it('should filter out older records', async () => {
      const result = await app.get(`/v1/sync/testChannel?since=${SECOND_OLDEST-1}`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      const firstRecord = body.records[0];
      expect(firstRecord).toHaveProperty('lastSynced', SECOND_OLDEST);
    });

    describe('Pagination', () => {

      const TOTAL_RECORDS = 20;
      let records = null;
        
      beforeAll(async () => {
        await store.remove('pagination', { recordType: 'pageTest' });

        // insert 20 records
        records = (new Array(TOTAL_RECORDS)).fill(0).map((zero, i) => ({
          recordType: 'pageTest',
          data: {
            id: `test-pagination-${i}`,
            value: Math.random(),
          },
        }));

        // import in series so there's a predictable order to test against
        for(let r of records) {
          await store.insert('pagination', r);
        }
      });

      it('should only return $limit records', async () => {
        const result = await app.get(`/v1/sync/pagination?since=0&limit=5`);
        expect(result).toHaveSucceeded();
        expect(result.body.records.length).toEqual(5);

        const secondResult = await app.get(`/v1/sync/pagination?since=0&limit=3`);
        expect(secondResult).toHaveSucceeded();
        expect(secondResult.body.records.length).toEqual(3);

        // arrays should be the same
        for(var i = 0; i < secondResult.body.records.length; ++i) {
          expect(result.body.records[i].id).toEqual(secondResult.body.records[i].id);
        }
      });

      it('should return a second page of records', async () => {
        const PAGE_SIZE = 5;
        const PAGE_COUNT = Math.ceil(TOTAL_RECORDS / PAGE_SIZE);
        const results = [];

        for(let i = 0; i < PAGE_COUNT; ++i) {
          const url = `/v1/sync/pagination?since=0&limit=5&page=${i}`;
          const result = await app.get(url);
          expect(result).toHaveSucceeded();
          expect(result.body.records.length).toEqual(5);
          results.push(result);
        }

        const response_record_ids = results
          .map(r => r.body.records)
          .flat()
          .map(r => r.data.id);
        const expected_record_ids = (new Array(TOTAL_RECORDS))
          .fill(0)
          .map((_, i) => `test-pagination-${i}`);

        expect(response_record_ids).toEqual(expected_record_ids);
      });

      it('should include the count of the entire query', async () => {
        const result = await app.get(`/v1/sync/pagination?since=0&limit=5`);
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('count', TOTAL_RECORDS);
        
        const secondResult = await app.get(`/v1/sync/pagination?since=0&limit=3`);
        expect(secondResult).toHaveSucceeded();
        expect(secondResult.body).toHaveProperty('count', TOTAL_RECORDS);
        
        const thirdResult = await app.get(`/v1/sync/pagination?since=0&limit=5&page=2`);
        expect(thirdResult).toHaveSucceeded();
        expect(thirdResult.body).toHaveProperty('count', TOTAL_RECORDS);
      });

    });
  });

  describe("Writes", () => {

    beforeAll(async () => {
      await store.remove('adder', { recordType: 'test-write' });
    });

    it('should add a record to a channel', async () => {
      const precheck = await store.findSince('adder', 0);
      expect(precheck).toHaveProperty('length', 0);

      const result = await app.post('/v1/sync/adder').send({
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

      const result = await app.post('/v1/sync/adder').send([
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
      const result = await app.post('/v1/sync/adder').send({
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

