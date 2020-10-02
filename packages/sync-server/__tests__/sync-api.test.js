import { createTestContext } from './utilities';

const { baseApp, store } = createTestContext();

describe("Sync API", () => {

  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');

    const testRecord = await store.insert('reference', {
      recordType: 'test',
      data: {
        id: 'id12345id',
        lastModified: new Date(),
        dataKey: 'dataValue',
      }
    });
  });

  describe("Reference", () => {
    
    const OLDEST = '123';

    it('should error if no since parameter is provided', async () => {
      const result = await app.get('/reference');
      expect(result).toHaveRequestError();
    });

    it('should get reference data', async () => {
      const result = await app.get(`/reference?since=${OLDEST}`);
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
      expect(firstRecord.data).toHaveProperty('lastModified');
    });

    test.todo('should get newer reference data');
    test.todo('should add a record to reference data');
    test.todo('should add multiple records to reference data');
    test.todo('should update an existing record in reference data');
  });

});

