import { setupSurveyFromObject } from '@tamanu/shared/demoData/surveys';
import { createTestContext } from '../utilities';

describe('Survey', () => {
  let app;
  let baseApp;
  let models;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('vitals', () => {
    beforeAll(async () => {
      await setupSurveyFromObject(models, {
        program: {
          id: 'vitals-program',
        },
        survey: {
          id: 'vitals-survey',
          surveyType: 'vitals',
        },
        questions: [
          {
            name: 'PatientVitalsSPO2',
            type: 'Number',
            validationCriteria: JSON.stringify({
              min: 0,
              max: 999,
            }),
            config: JSON.stringify({
              unit: 'mm Hg',
            }),
          },
        ],
      });
    });
    it('should return the vitals survey', async () => {
      const result = await app.get(`/v1/survey/vitals`);
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        id: 'vitals-survey',
        surveyType: 'vitals',
        components: [
          expect.objectContaining({
            dataElement: expect.objectContaining({
              id: 'pde-PatientVitalsSPO2',
              name: 'PatientVitalsSPO2',
              type: 'Number',
            }),
            config: JSON.stringify({
              unit: 'mm Hg',
            }),
            validationCriteria: JSON.stringify({
              min: 0,
              max: 999,
            }),
          }),
        ],
      });
    });
  });
});
