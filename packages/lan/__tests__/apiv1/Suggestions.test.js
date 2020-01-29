import { createTestContext } from '../utilities';
import { ICD10_DIAGNOSES, TRIAGE_DIAGNOSES } from 'shared/demoData';

const { baseApp, models } = createTestContext();

const testDiagnoses = ICD10_DIAGNOSES.slice(0, 50);

describe('Suggestions', () => {

  beforeAll(async () => {
    const tasks = [
      ...testDiagnoses,
      ...TRIAGE_DIAGNOSES
    ].map(d => models.ReferenceData.create(d));
    await Promise.all(tasks);
  });

  describe('Diagnoses', () => {
    const limit = 10;

    it('should get 0 suggestions with an empty query', async () => {
      const result = await baseApp.get('/v1/suggestions/icd10');
      expect(result).not.toHaveRequestError();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(0);
    });

    it('should get a full list of diagnoses with a general query', async () => {
      const result = await baseApp.get('/v1/suggestions/icd10?q=A');
      expect(result).not.toHaveRequestError();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(limit);
    });

    it('should get a partial list of diagnoses with a specific query', async () => {
      const count = testDiagnoses.filter(td => td.name.includes("bacterial")).length;
      expect(count).toBeLessThan(limit); // ensure we're actually testing filtering!
      const result = await baseApp.get('/v1/suggestions/icd10?q=bacterial');
      expect(result).not.toHaveRequestError();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(count);
    });

    // TODO: SQLite doesn't support ILIKE so this has to wait for postgres support
    xit('should not be case sensitive', async () => {
      const result = await baseApp.get('/v1/suggestions/icd10?q=dIAbETeS');
      expect(result).not.toHaveRequestError();
      const { body } = result;
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toEqual(limit);
    });

  });

});
