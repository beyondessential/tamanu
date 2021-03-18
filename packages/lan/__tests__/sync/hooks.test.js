import {
  buildNestedEncounter,
  upsertAssociations,
  fakeSurveyResponseAnswer,
  fake,
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
    expect(dbEncounter.markedForPush).toEqual(true);

    dbEncounter.markedForPush = false;
    dbEncounter.pushedAt = new Date();
    await dbEncounter.save();
    dbEncounter.markedForPush = false;
    dbEncounter.pushedAt = new Date();
    await dbEncounter.save(); // done twice because sequelize's model.changed uses equality to check

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

  it('marks patients for push when patient subchannel models are updated', async () => {
    // arrange
    const { Patient, Encounter } = context.models;
    const patient = await Patient.create(fake(Patient));
    expect(patient.markedForSync).toEqual(false);

    // act
    await Encounter.create(await buildNestedEncounter(context, patient.id));

    // assert
    expect(await Patient.findByPk(patient.id)).toHaveProperty('markedForSync', true);
  });
});
