import {
  buildNestedEncounter,
  upsertAssociations,
  fakeSurveyResponseAnswer,
  fake,
} from 'shared/test-helpers';
import { initDb } from '../../initDb';

describe('sync-related hooks', () => {
  let models;
  let context;
  beforeAll(async () => {
    context = await initDb({ syncClientMode: true });
    models = context.models;
  });
  afterAll(() => context.sequelize.close());

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
    await expect(models.Encounter.findByPk(encounter.id)).resolves.toHaveProperty(
      'markedForPush',
      false,
    );

    // act
    const newAnswer = {
      ...fakeSurveyResponseAnswer(),
      responseId: encounter.surveyResponses[0].id,
      dataElementId: encounter.surveyResponses[0].answers[0].dataElementId,
    };
    await models.SurveyResponseAnswer.create(newAnswer);

    // assert
    return expect(models.Encounter.findByPk(encounter.id)).resolves.toHaveProperty(
      'markedForPush',
      true,
    );
  });

  it('does not mark for push if pulledAt changes', async () => {
    // arrange
    const encounter = await buildNestedEncounter(context);
    await models.Encounter.create(encounter);
    await upsertAssociations(models.Encounter, encounter);
    const dbEncounter = await models.Encounter.findByPk(encounter.id);
    expect(dbEncounter.markedForPush).toEqual(true);

    dbEncounter.markedForPush = false;
    dbEncounter.pushedAt = new Date();
    await dbEncounter.save();
    await expect(models.Encounter.findByPk(encounter.id)).resolves.toHaveProperty(
      'markedForPush',
      false,
    );

    // act
    dbEncounter.endDate = new Date(); // update a field that would normally sync
    dbEncounter.pulledAt = new Date(); // pulledAt indicates update via import, so shouldn't mark for push
    await dbEncounter.save();

    // assert
    return expect(models.Encounter.findByPk(encounter.id)).resolves.toHaveProperty(
      'markedForPush',
      false,
    );
  });

  it('does not mark for push if only sync info columns change', async () => {
    // arrange
    const encounter = await buildNestedEncounter(context);
    await models.Encounter.create(encounter);
    await upsertAssociations(models.Encounter, encounter);
    const dbEncounter = await models.Encounter.findByPk(encounter.id);
    expect(dbEncounter.markedForPush).toEqual(true);

    dbEncounter.markedForPush = false;
    dbEncounter.pushedAt = new Date();
    await dbEncounter.save();
    await expect(models.Encounter.findByPk(encounter.id)).resolves.toHaveProperty(
      'markedForPush',
      false,
    );

    // act - update fields that, on their own, shouldn't trigger a sync
    dbEncounter.pushedAt = new Date();
    dbEncounter.markedForSync = !!dbEncounter.markedForSync;
    await dbEncounter.save();

    // assert
    return expect(models.Encounter.findByPk(encounter.id)).resolves.toHaveProperty(
      'markedForPush',
      false,
    );
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
