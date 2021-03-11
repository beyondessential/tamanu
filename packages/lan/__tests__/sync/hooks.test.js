import {
  buildNestedEncounter,
  upsertAssociations,
  fakeSurveyResponseAnswer,
} from 'shared/test-helpers';
import { createTestContext } from '../utilities';

describe('sync-related hooks', () => {
  let models;
  let context;
  beforeAll(async () => {
    context = await createTestContext();
    models = context.models;
  });

  it('marks root sync objects for push', async () => {
    // arrange
    const encounter = await buildNestedEncounter(context);
    await models.Encounter.create(encounter);
    await upsertAssociations(models.Encounter, encounter);
    const dbEncounter = await models.Encounter.findByPk(encounter.id);
    dbEncounter.markedForPush = false;
    dbEncounter.save();
    expect(await models.Encounter.findByPk(encounter.id)).toHaveProperty('markedForPush', false);

    // act
    const newAnswer = {
      ...fakeSurveyResponseAnswer(),
      responseId: encounter.surveyResponses[0].id,
      dataElementId: encounter.surveyResponses[0].answers[0].dataElementId,
    };
    await models.SurveyResponseAnswer.create(newAnswer);

    // assert
    expect(await models.Encounter.findByPk(encounter.id)).toHaveProperty('markedForPush', true);
  });
});
