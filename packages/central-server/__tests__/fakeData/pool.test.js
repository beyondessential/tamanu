import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SURVEY_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { POOL_SIZE, pooledWithChild } from '@tamanu/fake-data/populateDb';

import { createTestContext } from '../utilities';

describe('fake-data pooledWithChild', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  const poolSurvey = (surveyType, options = {}) =>
    pooledWithChild(
      models.Survey,
      () => models.Survey.create(fake(models.Survey, { surveyType })),
      models.SurveyScreenComponent,
      surveyId =>
        models.SurveyScreenComponent.create(fake(models.SurveyScreenComponent, { surveyId })),
      { childKey: 'surveyId', where: { surveyType }, ...options },
    );

  const componentCount = surveyId => models.SurveyScreenComponent.count({ where: { surveyId } });

  it('gives a new parent exactly one child', async () => {
    const survey = await poolSurvey(SURVEY_TYPES.REFERRAL);
    expect(await componentCount(survey.id)).toBe(1);
  });

  it('adds to a reused parent however many children other parents hold', async () => {
    const crowded = await poolSurvey(SURVEY_TYPES.OBSOLETE, { size: 1 });
    await models.SurveyScreenComponent.bulkCreate(
      Array.from({ length: POOL_SIZE }, () =>
        fake(models.SurveyScreenComponent, { surveyId: crowded.id }),
      ),
    );

    const reused = await poolSurvey(SURVEY_TYPES.VITALS, { size: 1 });
    expect(reused.id).not.toBe(crowded.id);
    expect(await componentCount(reused.id)).toBe(1);

    const again = await poolSurvey(SURVEY_TYPES.VITALS, { size: 1 });
    expect(again.id).toBe(reused.id);
    expect(await componentCount(reused.id)).toBe(2);
  });
});
