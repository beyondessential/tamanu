import { setupSurveyFromObject } from '@tamanu/database/demoData/surveys';
import { createDummyEncounter } from '@tamanu/database/demoData/patients';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { SURVEY_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

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
    let fullPermsApp = null;
    let chartSurvey1 = null;
    let chartSurvey2 = null;
    let patient;
    let encounter;
    let historicalSimpleChart;
    let historicalComplexChart;
    let historicalChartWithoutAnswers;

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

      // Create full permissions app for tests to allow listing all charts
      fullPermsApp = await baseApp.asNewRole([['list', 'Charting']]);

      // Create patient and encounter for historical charts test
      patient = await models.Patient.create(fake(models.Patient));
      encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      // Create historical simple chart with answers
      historicalSimpleChart = await models.Survey.create(
        fake(models.Survey, {
          surveyType: SURVEY_TYPES.SIMPLE_CHART,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
          name: 'Historical Simple Chart With Answers',
        }),
      );

      // Create historical complex chart with answers
      historicalComplexChart = await models.Survey.create(
        fake(models.Survey, {
          surveyType: SURVEY_TYPES.COMPLEX_CHART,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
          name: 'Historical Complex Chart With Answers',
        }),
      );

      // Create survey responses with answers for the encounter
      const response1 = await models.SurveyResponse.create(
        fake(models.SurveyResponse, {
          surveyId: historicalSimpleChart.id,
          encounterId: encounter.id,
        }),
      );
      await models.SurveyResponseAnswer.create(
        fake(models.SurveyResponseAnswer, {
          responseId: response1.id,
        }),
      );

      const response2 = await models.SurveyResponse.create(
        fake(models.SurveyResponse, {
          surveyId: historicalComplexChart.id,
          encounterId: encounter.id,
        }),
      );
      await models.SurveyResponseAnswer.create(
        fake(models.SurveyResponseAnswer, {
          responseId: response2.id,
        }),
      );

      // Create historical chart without answers (should not be included)
      historicalChartWithoutAnswers = await models.Survey.create(
        fake(models.Survey, {
          surveyType: SURVEY_TYPES.SIMPLE_CHART,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
          name: 'Historical Chart Without Answers',
        }),
      );
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

    it('should return historical simple and complex charts with answers', async () => {
      const result = await fullPermsApp.get(`/api/survey/charts?encounterId=${encounter.id}`);
      expect(result).toHaveSucceeded();

      const surveyIds = result.body.map(survey => survey.id);
      expect(surveyIds).toContain(historicalSimpleChart.id);
      expect(surveyIds).toContain(historicalComplexChart.id);
      expect(surveyIds).not.toContain(historicalChartWithoutAnswers.id);
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

  describe('procedureType surveys', () => {
    let procedureTypeId;
    let survey1, survey2, survey3, historicalSurvey;

    beforeAll(async () => {
      // Create a procedure type reference data
      const procedureType = await models.ReferenceData.create({
        id: 'procedure-type-1',
        type: 'procedureType',
        code: 'PROC001',
        name: 'Test Procedure Type',
      });
      procedureTypeId = procedureType.id;

      // Create surveys for procedure type
      survey1 = await models.Survey.create({
        id: 'procedure-survey-1',
        name: 'C Procedure Survey',
        surveyType: 'procedure',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      survey2 = await models.Survey.create({
        id: 'procedure-survey-2',
        name: 'A Procedure Survey',
        surveyType: 'procedure',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      survey3 = await models.Survey.create({
        id: 'procedure-survey-3',
        name: 'B Procedure Survey',
        surveyType: 'procedure',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create a historical survey that should be filtered out
      historicalSurvey = await models.Survey.create({
        id: 'procedure-survey-historical',
        name: 'Historical Survey',
        surveyType: 'procedure',
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      });

      // Link surveys to procedure type
      await models.ProcedureTypeSurvey.create({
        procedureTypeId: procedureTypeId,
        surveyId: survey1.id,
      });

      await models.ProcedureTypeSurvey.create({
        procedureTypeId: procedureTypeId,
        surveyId: survey2.id,
      });

      await models.ProcedureTypeSurvey.create({
        procedureTypeId: procedureTypeId,
        surveyId: survey3.id,
      });

      await models.ProcedureTypeSurvey.create({
        procedureTypeId: procedureTypeId,
        surveyId: historicalSurvey.id,
      });
    });

    it('should return surveys for a procedure type sorted alphabetically', async () => {
      const result = await app.get(`/api/survey/procedureType/${procedureTypeId}`);
      expect(result).toHaveSucceeded();

      expect(result.body).toHaveLength(3);
      expect(result.body[0].name).toBe('A Procedure Survey');
      expect(result.body[1].name).toBe('B Procedure Survey');
      expect(result.body[2].name).toBe('C Procedure Survey');

      // Verify the surveys have the expected structure
      expect(result.body[0]).toMatchObject({
        id: 'procedure-survey-2',
        name: 'A Procedure Survey',
        surveyType: 'procedure',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });
    });

    it('should not return historical surveys', async () => {
      const result = await app.get(`/api/survey/procedureType/${procedureTypeId}`);
      expect(result).toHaveSucceeded();

      const surveyNames = result.body.map(survey => survey.name);
      expect(surveyNames).not.toContain('Historical Survey');
    });

    it('should return empty array for procedure type with no surveys', async () => {
      const emptyProcedureType = await models.ReferenceData.create({
        id: 'procedure-type-empty',
        type: 'procedureType',
        code: 'PROC002',
        name: 'Empty Procedure Type',
      });

      const result = await app.get(`/api/survey/procedureType/${emptyProcedureType.id}`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(0);
    });

    it('should return empty array for non-existent procedure type', async () => {
      const result = await app.get(`/api/survey/procedureType/non-existent-id`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(0);
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
