import config from 'config';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { CHARTING_DATA_ELEMENT_IDS, SURVEY_TYPES } from '@tamanu/constants';
import { setupSurveyFromObject } from '@tamanu/database/demoData/surveys';
import { fake, fakeUser } from '@tamanu/shared/test-helpers/fake';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { createTestContext } from '../utilities';

describe('EncounterCharting', () => {
  const [facilityId] = selectFacilityIds(config);
  let patient = null;
  let user = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await baseApp.asUser(user);
  });
  afterAll(() => ctx.close());

  describe('GET encounter chart instances', () => {
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

  describe('write', () => {
    describe('charting', () => {
      let chartsEncounter = null;
      let chartsPatient = null;

      beforeAll(async () => {
        chartsPatient = await models.Patient.create(await createDummyPatient(models));
        chartsEncounter = await models.Encounter.create({
          ...(await createDummyEncounter(models, { endDate: null })),
          patientId: chartsPatient.id,
          reasonForEncounter: 'charting test',
        });

        await setupSurveyFromObject(models, {
          program: {
            id: 'charts-program',
          },
          survey: {
            id: 'simple-chart-survey',
            survey_type: 'simpleChart',
          },
          questions: [
            {
              name: 'PatientChartingDate',
              type: 'DateTime',
            },
            {
              name: 'ChartQuestionOne',
              type: 'Number',
            },
            {
              name: 'ChartQuestionTwo',
              type: 'Number',
            },
          ],
        });
      });

      beforeEach(async () => {
        await models.SurveyResponseAnswer.truncate({});
        await models.SurveyResponse.truncate({});
      });

      it('should record a new simple chart reading', async () => {
        const submissionDate = getCurrentDateTimeString();
        const result = await app.post('/api/surveyResponse').send({
          surveyId: 'simple-chart-survey',
          patientId: chartsPatient.id,
          startTime: submissionDate,
          endTime: submissionDate,
          answers: {
            [CHARTING_DATA_ELEMENT_IDS.dateRecorded]: submissionDate,
            'pde-ChartQuestionOne': 1234,
          },
          facilityId,
        });
        expect(result).toHaveSucceeded();
        const saved = await models.SurveyResponseAnswer.findOne({
          where: { dataElementId: 'pde-ChartQuestionOne', body: '1234' },
        });
        expect(saved).toHaveProperty('body', '1234');
      });

      it('should get simple chart readings for an encounter', async () => {
        const surveyId = 'simple-chart-survey';
        const submissionDate = getCurrentDateTimeString();
        const answers = {
          [CHARTING_DATA_ELEMENT_IDS.dateRecorded]: submissionDate,
          'pde-ChartQuestionOne': 123,
          'pde-ChartQuestionTwo': 456,
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
    });
  });
});
