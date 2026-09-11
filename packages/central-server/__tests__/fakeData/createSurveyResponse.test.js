import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { fake } from '@tamanu/fake-data/fake';
import {
  createEncounter,
  createPatient,
  createSurveyResponse,
  generateImportData,
} from '@tamanu/fake-data/populateDb';

import { createTestContext } from '../utilities';

describe('fake-data createSurveyResponse', () => {
  let ctx;
  let models;
  let encounter;
  let survey;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    const imported = await generateImportData(models);
    survey = imported.survey;
    const { patient } = await createPatient({
      models,
      facilityId: imported.facility.id,
      userId: imported.user.id,
    });
    ({ encounter } = await createEncounter({
      models,
      patientId: patient.id,
      departmentId: imported.department.id,
      locationId: imported.location.id,
      userId: imported.user.id,
    }));
  });

  afterAll(() => ctx.close());

  const answersFor = async surveyId => {
    const response = await models.SurveyResponse.findOne({
      where: { encounterId: encounter.id, surveyId },
    });
    return models.SurveyResponseAnswer.findAll({ where: { responseId: response.id } });
  };

  it('answers every screen component of the survey', async () => {
    await createSurveyResponse({ models, encounterId: encounter.id, surveyId: survey.id });

    const components = await models.SurveyScreenComponent.findAll({
      where: { surveyId: survey.id },
    });
    expect(components.length).toBeGreaterThan(0);
    expect(components.every(c => c.dataElementId)).toBe(true);

    const answers = await answersFor(survey.id);
    expect(answers.map(a => a.dataElementId).sort()).toEqual(
      components.map(c => c.dataElementId).sort(),
    );
  });

  it('leaves a component without a data element alone', async () => {
    const bare = await models.Survey.create(fake(models.Survey));
    const component = await models.SurveyScreenComponent.create(
      fake(models.SurveyScreenComponent, { surveyId: bare.id }),
    );
    expect(component.dataElementId).toBeNull();

    await createSurveyResponse({ models, encounterId: encounter.id, surveyId: bare.id });

    await component.reload();
    expect(component.dataElementId).toBeNull();
    expect(await answersFor(bare.id)).toEqual([]);
  });
});
