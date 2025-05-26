import { setupSurveyFromObject } from '@tamanu/database/demoData/surveys';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { SURVEY_TYPES } from '@tamanu/constants';

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

  describe('survey list', () => {
    beforeAll(async () => {
      await setupSurveyFromObject(models, {
        program: {
          id: 'survey-program',
        },
        survey: {
          id: 'program-survey-1',
          surveyType: 'programs',
          name: 'B Survey',
        },
        questions: [
          {
            name: 'Question1',
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

      await setupSurveyFromObject(models, {
        program: {
          id: 'survey-program',
        },
        survey: {
          id: 'program-survey-2',
          surveyType: 'programs',
          name: 'A Survey',
        },
        questions: [
          {
            name: 'Question2',
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

      await setupSurveyFromObject(models, {
        program: {
          id: 'survey-program',
        },
        survey: {
          id: 'program-survey-3',
          surveyType: 'programs',
          name: 'C Survey',
        },
        questions: [
          {
            name: 'Question3',
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

    it('sorted alphabetically', async () => {
      const result = await app.get(`/api/survey?type=${SURVEY_TYPES.PROGRAMS}`);
      expect(result).toHaveSucceeded();

      expect(result.body.surveys).toHaveLength(3);
      expect(result.body.surveys[0].name).toBe('A Survey');
      expect(result.body.surveys[1].name).toBe('B Survey');
      expect(result.body.surveys[2].name).toBe('C Survey');
    });
  });

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
      const result = await app.get(`/api/survey/vitals`);
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

  describe('permissions', () => {
    beforeAll(async () => {
      await setupSurveyFromObject(models, {
        program: {
          id: 'survey-program',
        },
        survey: {
          id: 'program-survey',
          surveyType: 'programs',
        },
        questions: [
          {
            name: 'PatientSPO2',
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

    disableHardcodedPermissionsForSuite();

    it('does not throw forbidden error when role has sufficient permission', async () => {
      const permissions = [
        ['list', 'SurveyResponse'],
        ['read', 'Survey', 'program-survey'],
      ];

      app = await baseApp.asNewRole(permissions);

      const result = await app.get(`/api/survey/program-survey/surveyResponses`);
      expect(result).toHaveSucceeded();
    });

    it('throws forbidden error when role does not have sufficient permission', async () => {
      const permissions = [['list', 'SurveyResponse']];

      app = await baseApp.asNewRole(permissions);

      const result = await app.get(`/api/survey/program-survey/surveyResponses`);
      expect(result).toHaveStatus(403);
    });
  });
});
