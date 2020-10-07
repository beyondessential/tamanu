import { createTestContext } from './utilities';
import { subDays, subHours } from 'date-fns';

const { baseApp, store } = createTestContext();

const makeDate = (daysAgo, hoursAgo=0) => {
  return subHours(subDays(new Date(), daysAgo), hoursAgo).valueOf();
};

const OLDEST = makeDate(20);
const SECOND_OLDEST = makeDate(10);

const RECORDS = [
  { lastModified: OLDEST, dataKey: 'first' },
  { lastModified: SECOND_OLDEST, dataKey: 'second' },
];

describe("Sync API", () => {

  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');

    await Promise.all(RECORDS.map(r => store.insert('reference', {
      recordType: 'test',
      data: r,
    })));
  });

  describe("Reference", () => {
    
    it('should error if no since parameter is provided', async () => {
      const result = await app.get('/reference');
      expect(result).toHaveRequestError();
    });

    it('should get reference data', async () => {
      const result = await app.get(`/reference?since=${OLDEST-1}`);
      expect(result).toHaveSucceeded();
      
      const { body } = result;
      expect(body.count).toBeGreaterThan(0);
      expect(body).toHaveProperty('records');
      expect(body).toHaveProperty('requestedAt');
      expect(body.records.length).toBeGreaterThan(0);

      const firstRecord = body.records[0];
      expect(firstRecord).toHaveProperty('recordType');
      expect(firstRecord).toHaveProperty('data');
      expect(firstRecord.data).toHaveProperty('id');
      expect(firstRecord.data).toHaveProperty('lastModified', OLDEST);
    });

    it('should get newer reference data', async () => {
      const result = await app.get(`/reference?since=${SECOND_OLDEST-1}`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      const firstRecord = body.records[0];
      expect(firstRecord).toHaveProperty('recordType');
      expect(firstRecord).toHaveProperty('data');
      expect(firstRecord.data).toHaveProperty('id');
      expect(firstRecord.data).toHaveProperty('lastModified', SECOND_OLDEST);
    });

    test.todo('should add a record to reference data');
    test.todo('should add multiple records to reference data');

    test.todo('should update an existing record in reference data');

    test.todo('should only return $limit records');
    test.todo('should return a second page of records');
  });

});

