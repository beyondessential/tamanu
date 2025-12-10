import { getDependentAssociations } from '../../src/utils/getDependentAssociations';
import { createTestDatabase, closeDatabase } from '../utilities';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

describe('getDependentAssociations', () => {
  let models;

  beforeAll(async () => {
    const database = await createTestDatabase();
    models = database.models;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('returns associations with type HasMany or HasOne for a model', () => {
    const associations = getDependentAssociations(models.SurveyResponse);
    const associationNames = associations.map(({ target }) => target.tableName);
    expect(associationNames).toEqual(
      expect.arrayContaining(['survey_response_answers', 'referrals']),
    );
  });
});
