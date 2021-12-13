import { createTestContext } from '../utilities';
import { testDiagnoses } from '../seed';

describe('Suggestions', () => {
  let userApp = null;
  let baseApp = null;
  let models = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    userApp = await baseApp.asRole('practitioner');
  });

  describe('Patients', () => {
    test.todo('should not get patients without permission');
  });

  describe('General functionality (via diagnoses)', () => {
    const limit = 25;

    it('should get 0 suggestions with an empty query', async () => {
      const result = await userApp.get('/v1/suggestions/icd10');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(0);
    });

    it('should get a full list of diagnoses with a general query', async () => {
      const result = await userApp.get('/v1/suggestions/icd10?q=A');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(limit);
    });

    it('should get a partial list of diagnoses with a specific query', async () => {
      const count = testDiagnoses.filter(td => td.name.includes('bacterial')).length;
      expect(count).toBeLessThan(limit); // ensure we're actually testing filtering!
      const result = await userApp.get('/v1/suggestions/icd10?q=bacterial');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(count);
    });

    it('should not be case sensitive', async () => {
      const result = await userApp.get('/v1/suggestions/icd10?q=pNeUmOnIa');
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should look up a specific suggestion', async () => {
      const record = await models.ReferenceData.findOne();
      const result = await userApp.get(`/v1/suggestions/icd10/${record.id}`);
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toHaveProperty('name', record.name);
      expect(body).toHaveProperty('id', record.id);
    });
  });

  it('should get suggestions for a medication', async () => {
    const result = await userApp.get('/v1/suggestions/drug?q=a');
    expect(result).toHaveSucceeded();
    const { body } = result;
    expect(body).toBeInstanceOf(Array);
    expect(body.length).toBeGreaterThan(0);
  });
});
