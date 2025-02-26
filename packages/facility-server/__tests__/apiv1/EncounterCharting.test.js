import config from 'config';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { CHARTING_DATA_ELEMENT_IDS, SURVEY_TYPES } from '@tamanu/constants';
import { setupSurveyFromObject } from '@tamanu/database/demoData/surveys';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { createTestContext } from '../utilities';

async function createSimpleChartSurvey(models, index) {
  const letter = String.fromCharCode(65 + index);
  const { survey } = await setupSurveyFromObject(models, {
    program: {
      id: 'charts-program',
    },
    survey: {
      id: `simple-chart-survey-${index}`,
      name: `Survey ${letter}`,
      surveyType: SURVEY_TYPES.SIMPLE_CHART,
    },
    questions: [
      {
        name: `ChartQuestionOne${letter}`,
        type: 'Number',
      },
      {
        name: `ChartQuestionTwo${letter}`,
        type: 'Number',
      },
    ],
  });

  const chartingDatePde = await models.ProgramDataElement.findOne({
    where: {
      id: CHARTING_DATA_ELEMENT_IDS.dateRecorded,
    },
  });
  if (!chartingDatePde) {
    await models.ProgramDataElement.create({
      id: CHARTING_DATA_ELEMENT_IDS.dateRecorded,
      code: 'PatientChartingDate',
      name: 'PatientChartingDate',
      type: 'DateTime',
    });
  }

  await models.SurveyScreenComponent.create({
    dataElementId: CHARTING_DATA_ELEMENT_IDS.dateRecorded,
    surveyId: survey.id,
  });
}

describe('EncounterCharting', () => {
  const [facilityId] = selectFacilityIds(config);
  let patient = null;
  let app = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    const baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    const user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await baseApp.asUser(user);
  });
  afterAll(async () => {
    await ctx.close();
  });

  describe('Chart instances', () => {
    it('should get a list of chart instances of a chart for an encounter', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });
      const program = await models.Program.create({ ...fake(models.Program) });
      const survey = await models.Survey.create({
        ...fake(models.Survey),
        code: 'complex-chart-core',
        programId: program.id,
        surveyType: SURVEY_TYPES.COMPLEX_CHART_CORE,
      });
      const dataElement = await models.ProgramDataElement.create({
        ...fake(models.ProgramDataElement),
        id: CHARTING_DATA_ELEMENT_IDS.complexChartInstanceName,
      });
      const response1 = await models.SurveyResponse.create({
        ...fake(models.SurveyResponse),
        surveyId: survey.id,
        encounterId: encounter.id,
      });
      const response2 = await models.SurveyResponse.create({
        ...fake(models.SurveyResponse),
        surveyId: survey.id,
        encounterId: encounter.id,
      });
      const chartInstance1Answer1 = await models.SurveyResponseAnswer.create({
        ...fake(models.SurveyResponseAnswer),
        dataElementId: dataElement.id,
        responseId: response1.id,
        body: 'Chart 1',
      });
      const chartInstance1Answer2 = await models.SurveyResponseAnswer.create({
        ...fake(models.SurveyResponseAnswer),
        dataElementId: dataElement.id,
        responseId: response2.id,
        body: 'Chart 2',
      });

      const result = await app.get(
        `/api/encounter/${encounter.id}/charts/${survey.id}/chartInstances`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        count: 2,
        data: expect.any(Array),
      });
      const chartInstance1 = result.body.data.find((x) => x.chartInstanceId === response1.id);
      const chartInstance2 = result.body.data.find((x) => x.chartInstanceId === response2.id);

      expect(chartInstance1).toMatchObject({
        chartSurveyId: survey.id,
        chartInstanceId: response1.id,
        chartInstanceName: chartInstance1Answer1.body,
      });

      expect(chartInstance2).toMatchObject({
        chartSurveyId: survey.id,
        chartInstanceId: response2.id,
        chartInstanceName: chartInstance1Answer2.body,
      });
    });
  });

  describe('Chart records', () => {
    let chartsEncounter = null;
    let chartsPatient = null;

    beforeAll(async () => {
      chartsPatient = await models.Patient.create(await createDummyPatient(models));
      chartsEncounter = await models.Encounter.create({
        ...(await createDummyEncounter(models, { endDate: null })),
        patientId: chartsPatient.id,
        reasonForEncounter: 'charting test',
      });

      for (let i = 0; i < 3; i++) {
        await createSimpleChartSurvey(models, i);
      }
    });

    beforeEach(async () => {
      await models.SurveyResponseAnswer.truncate({});
      await models.SurveyResponse.truncate({});
    });

    it('should record a new simple chart reading', async () => {
      const submissionDate = getCurrentDateTimeString();
      const result = await app.post('/api/surveyResponse').send({
        surveyId: 'simple-chart-survey-0',
        patientId: chartsPatient.id,
        startTime: submissionDate,
        endTime: submissionDate,
        answers: {
          [CHARTING_DATA_ELEMENT_IDS.dateRecorded]: submissionDate,
          'pde-ChartQuestionOneA': 1234,
        },
        facilityId,
      });
      expect(result).toHaveSucceeded();
      const saved = await models.SurveyResponseAnswer.findOne({
        where: { dataElementId: 'pde-ChartQuestionOneA', body: '1234' },
      });
      expect(saved).toHaveProperty('body', '1234');
    });

    it('should get simple chart readings for an encounter', async () => {
      const surveyId = 'simple-chart-survey-0';
      const submissionDate = getCurrentDateTimeString();
      const answers = {
        [CHARTING_DATA_ELEMENT_IDS.dateRecorded]: submissionDate,
        'pde-ChartQuestionOneA': 123,
        'pde-ChartQuestionTwoA': 456,
      };
      await app.post('/api/surveyResponse').send({
        surveyId,
        patientId: chartsPatient.id,
        startTime: submissionDate,
        endTime: submissionDate,
        answers,
        facilityId,
      });
      const result = await app.get(`/api/encounter/${chartsEncounter.id}/charts/${surveyId}`);
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body).toHaveProperty('count');
      expect(body.count).toBeGreaterThan(0);
      expect(body).toHaveProperty('data');
      expect(body.data).toEqual(
        expect.arrayContaining(
          Object.entries(answers).map(([key, value]) =>
            expect.objectContaining({
              dataElementId: key,
              records: {
                [submissionDate]: expect.objectContaining({
                  id: expect.any(String),
                  body: value.toString(),
                  logs: null,
                }),
              },
            }),
          ),
        ),
      );
    });

    it('should return a utility list about chart surveys with responses', async () => {
      const submissionDate = getCurrentDateTimeString();
      await app.post('/api/surveyResponse').send({
        surveyId: 'simple-chart-survey-2',
        patientId: chartsPatient.id,
        startTime: submissionDate,
        endTime: submissionDate,
        answers: {
          [CHARTING_DATA_ELEMENT_IDS.dateRecorded]: submissionDate,
          'pde-ChartQuestionOneC': 123,
          'pde-ChartQuestionTwoC': 456,
        },
        facilityId,
      });
      await app.post('/api/surveyResponse').send({
        surveyId: 'simple-chart-survey-1',
        patientId: chartsPatient.id,
        startTime: submissionDate,
        endTime: submissionDate,
        answers: {
          [CHARTING_DATA_ELEMENT_IDS.dateRecorded]: submissionDate,
          'pde-ChartQuestionOneB': 123,
          'pde-ChartQuestionTwoB': 456,
        },
        facilityId,
      });

      const result = await app.get(`/api/encounter/${chartsEncounter.id}/initialChart`);
      expect(result).toHaveSucceeded();
      expect(result.body.data.survey.name).toBe('Survey B');
    });
  });
});
