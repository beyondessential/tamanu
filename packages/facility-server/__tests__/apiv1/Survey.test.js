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

  describe('chart surveys', () => {
    let limitedPermsApp = null;
    let chartSurvey1 = null;
    let chartSurvey2 = null;

    disableHardcodedPermissionsForSuite();

    beforeAll(async () => {
      // Create chart surveys
      const { survey: survey1 } = await setupSurveyFromObject(models, {
        program: {
          id: 'chart-program-1',
        },
        survey: {
          id: 'chart-survey-1',
          name: 'Chart Survey 1',
          surveyType: SURVEY_TYPES.SIMPLE_CHART,
        },
        questions: [
          {
            name: 'ChartQuestion1',
            type: 'Number',
          },
        ],
      });
      chartSurvey1 = survey1;

      const { survey: survey2 } = await setupSurveyFromObject(models, {
        program: {
          id: 'chart-program-2',
        },
        survey: {
          id: 'chart-survey-2',
          name: 'Chart Survey 2',
          surveyType: SURVEY_TYPES.SIMPLE_CHART,
        },
        questions: [
          {
            name: 'ChartQuestion2',
            type: 'Number',
          },
        ],
      });
      chartSurvey2 = survey2;

      // Create limited permissions app
      const permissions = [['list', 'Charting', chartSurvey1.id]];
      limitedPermsApp = await baseApp.asNewRole(permissions);
    });

    it('should return only permitted chart surveys when user has limited permissions', async () => {
      const result = await limitedPermsApp.get('/api/survey/charts');
      expect(result).toHaveSucceeded();

      // Should only return the survey the user has permission to access
      const surveyIds = result.body.map(survey => survey.id);
      expect(surveyIds).toContain(chartSurvey1.id);
      expect(surveyIds).not.toContain(chartSurvey2.id);
      expect(surveyIds).toHaveLength(1);
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
