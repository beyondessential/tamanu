import { fake } from '@tamanu/fake-data/fake';
import { PROGRAM_DATA_ELEMENT_TYPES, SURVEY_TYPES } from '@tamanu/constants';

import { createTestContext } from '../../utilities';
import { createSurveyResponseTestHelpers } from './helpers';

describe('SurveyResponse PUT /complexChartInstance/:id', () => {
  let app;
  let baseApp;
  let models;
  let ctx;
  let setupComplexChartSurvey;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    ({ setupComplexChartSurvey } = createSurveyResponseTestHelpers(models));
  });
  afterAll(() => ctx.close());

  it('should update existing answers', async () => {
    const { answer, response } = await setupComplexChartSurvey();
    const oldValue = answer.body;
    const newValue = 'Updated answer';

    const result = await app
      .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
      .send({
        answers: {
          [answer.dataElementId]: newValue,
        },
      });
    await answer.reload();

    expect(result).toHaveSucceeded();
    expect(answer.body).toEqual(newValue);
    expect(answer.body).not.toEqual(oldValue);
  });

  it('should create new answers for data elements not previously answered', async () => {
    const { ProgramDataElement, SurveyScreenComponent } = models;
    const { response } = await setupComplexChartSurvey();
    const newDataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
      type: PROGRAM_DATA_ELEMENT_TYPES.TEXT,
    });
    await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      dataElementId: newDataElement.id,
      surveyId: response.surveyId,
      calculation: '',
    });
    const newValue = 'New answer value';

    const result = await app
      .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
      .send({
        answers: {
          [newDataElement.id]: newValue,
        },
      });
    const newAnswer = await models.SurveyResponseAnswer.findOne({
      where: {
        responseId: response.id,
        dataElementId: newDataElement.id,
      },
    });

    expect(result).toHaveSucceeded();
    expect(newAnswer).toBeTruthy();
    expect(newAnswer.body).toEqual(newValue);
  });

  it('should ignore null values in answers', async () => {
    const { answer, response } = await setupComplexChartSurvey();
    const originalValue = answer.body;

    const result = await app
      .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
      .send({
        answers: {
          [answer.dataElementId]: null,
        },
      });
    await answer.reload();

    expect(result).toHaveSucceeded();
    expect(answer.body).toEqual(originalValue);
  });

  it('should update multiple answers in a single request', async () => {
    const { ProgramDataElement, SurveyScreenComponent, SurveyResponseAnswer } = models;
    const { answer: answer1, response } = await setupComplexChartSurvey();
    const newDataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
      type: PROGRAM_DATA_ELEMENT_TYPES.TEXT,
    });
    await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      dataElementId: newDataElement.id,
      surveyId: response.surveyId,
      calculation: '',
    });
    const answer2 = await models.SurveyResponseAnswer.create({
      ...fake(SurveyResponseAnswer),
      dataElementId: newDataElement.id,
      responseId: response.id,
      body: 'Initial answer',
    });
    const oldValue1 = answer1.body;
    const oldValue2 = answer2.body;
    const newValue1 = 'New answer 1';
    const newValue2 = 'New answer 2';

    // Also create a missing answer
    const newAnswerDataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
      type: PROGRAM_DATA_ELEMENT_TYPES.TEXT,
    });
    await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      dataElementId: newAnswerDataElement.id,
      surveyId: response.surveyId,
      calculation: '',
    });
    const newAnswerValue = 'New answer value';

    const result = await app
      .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
      .send({
        answers: {
          [answer1.dataElementId]: newValue1,
          [answer2.dataElementId]: newValue2,
          [newAnswerDataElement.id]: newAnswerValue,
        },
      });
    await answer1.reload();
    await answer2.reload();

    expect(result).toHaveSucceeded();
    expect(answer1.body).toEqual(newValue1);
    expect(answer1.body).not.toEqual(oldValue1);
    expect(answer2.body).toEqual(newValue2);
    expect(answer2.body).not.toEqual(oldValue2);
  });

  it('should return 404 when survey response not found', async () => {
    const nonExistentId = 'non-existent-id';

    const result = await app
      .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(nonExistentId)}`)
      .send({
        answers: {
          'some-data-element-id': 'some value',
        },
      });

    expect(result).not.toHaveSucceeded();
    expect(result.status).toBe(404);
  });

  it('should return error when survey type is not COMPLEX_CHART_CORE', async () => {
    const { survey, response } = await setupComplexChartSurvey();
    await survey.update({ surveyType: SURVEY_TYPES.PROGRAMS });

    const result = await app
      .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
      .send({
        answers: {
          'some-data-element-id': 'some value',
        },
      });

    expect(result).not.toHaveSucceeded();
    expect(result.status).toBe(422);
  });

  it('should require charting write permission', async () => {
    const { answer, response } = await setupComplexChartSurvey();
    const unauthorizedApp = await baseApp.asRole('reception');

    const result = await unauthorizedApp
      .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
      .send({
        answers: {
          [answer.dataElementId]: 'some value',
        },
      });

    expect(result).toBeForbidden();
  });
});
