import { createTestContext } from './utilities';

const { baseApp, models } = createTestContext();

describe("Sync API", () => {

  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
  });


  describe("Reference", () => {
    
    const OLDEST = '2000-01-01';

    it('should error if no since parameter is provided', async () => {
      const result = await app.get('/reference');
      expect(result).toHaveRequestError();
    });

    it('should get reference data', async () => {
      const result = await app.get(`/reference?since=${OLDEST}`);
      expect(result).toHaveSucceeded();
    });

    test.todo('should get newer reference data');
  });

});

