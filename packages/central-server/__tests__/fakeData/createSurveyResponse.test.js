import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  it('answers every screen component of the survey', async () => {
    const { survey, facility, department, location, user } = await generateImportData(models);
    const { patient } = await createPatient({ models, facilityId: facility.id, userId: user.id });
    const { encounter } = await createEncounter({
      models,
      patientId: patient.id,
      departmentId: department.id,
      locationId: location.id,
      userId: user.id,
    });

    await createSurveyResponse({ models, encounterId: encounter.id, surveyId: survey.id });

    const components = await models.SurveyScreenComponent.findAll({
      where: { surveyId: survey.id },
    });
    expect(components.length).toBeGreaterThan(0);
    expect(components.every(c => c.dataElementId)).toBe(true);

    const response = await models.SurveyResponse.findOne({
      where: { encounterId: encounter.id, surveyId: survey.id },
    });
    const answers = await models.SurveyResponseAnswer.findAll({
      where: { responseId: response.id },
    });
    expect(answers.map(a => a.dataElementId).sort()).toEqual(
      components.map(c => c.dataElementId).sort(),
    );
  });
});
