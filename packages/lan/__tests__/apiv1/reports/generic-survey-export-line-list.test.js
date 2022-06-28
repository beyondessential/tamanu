import { randomReferenceDataObjects } from 'shared/demoData/patients';
import { PROGRAM_DATA_ELEMENT_TYPES } from 'shared/constants';
import { fake } from 'shared/test-helpers';
import { subDays, format } from 'date-fns';
import { createTestContext } from '../../utilities';

const REPORT_URL = '/v1/reports/generic-survey-export-line-list';
const PROGRAM_ID = 'test-program-id';
const SURVEY_ID = 'test-survey-id';
const SENSITIVE_SURVEY_ID = 'test-survey-id-sensitive';

// Not entirely sure why this works
// https://stackoverflow.com/a/66672462
const getExpectedDate = date =>
  new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  );

const createDummySurvey = async models => {
  await models.Program.create({
    id: PROGRAM_ID,
    name: 'Test program',
  });

  await models.Survey.create({
    id: SURVEY_ID,
    name: 'Test survey',
    programId: PROGRAM_ID,
  });

  const questions = [
    { id: 'pde-Instruction', type: PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION },
    { id: 'pde-Test1', type: 'Not Known' },
    { id: 'pde-CheckboxQ', type: PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX },
    { id: 'pde-DateQ', type: PROGRAM_DATA_ELEMENT_TYPES.DATE },
    {
      id: 'pde-Autocomplete',
      type: PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE,
      config: '{"source":"ReferenceData"}',
    },
    { id: 'pde-Result', name: 'Result', type: PROGRAM_DATA_ELEMENT_TYPES.RESULT },
  ];

  await models.ProgramDataElement.bulkCreate(
    questions.map(({ id, type }) => ({
      id,
      code: `code-${id}`,
      name: `name-${id}`,
      type,
    })),
  );
  await models.SurveyScreenComponent.bulkCreate(
    questions.map(({ id, config }) => ({ dataElementId: id, surveyId: SURVEY_ID, config })),
  );
};

const submitSurveyForPatient = (app, patient, date, expectedVillage) =>
  app.post('/v1/surveyResponse').send({
    surveyId: SURVEY_ID,
    startTime: date,
    patientId: patient.id,
    endTime: date,
    answers: {
      'pde-Test1': 'Data point 1',
      'pde-CheckboxQ': 'true',
      'pde-DateQ': '2022-05-30T02:37:12.826Z',
      'pde-Autocomplete': expectedVillage.id,
    },
  });

describe('Generic survey export', () => {
  let testContext = null;
  beforeAll(async () => {
    testContext = await createTestContext();
  });
  afterAll(() => testContext.close());

  it('should reject creating a report with insufficient permissions', async () => {
    const noPermsApp = await testContext.baseApp.asRole('base');
    const result = await noPermsApp.post(REPORT_URL, {});
    expect(result).toBeForbidden();
  });

  describe('Basic test', () => {
    let app = null;
    let expectedPatient = null;
    let expectedVillage = null;
    let unexpectedVillage = null;

    beforeAll(async () => {
      const { models, baseApp } = testContext;
      app = await baseApp.asRole('practitioner');
      await createDummySurvey(models);
      [expectedVillage, unexpectedVillage] = await randomReferenceDataObjects(models, 'village', 2);
      expectedPatient = await models.Patient.create(
        await fake(models.Patient, {
          villageId: expectedVillage.id,
          dateOfBirth: subDays(new Date(), 370),
        }),
      );
    });

    beforeEach(async () => {
      await testContext.models.SurveyResponse.destroy({ where: {} });
    });

    it('should return an error if no surveyId is sent', async () => {
      const result = await app.post(REPORT_URL).send({
        parameters: {},
      });
      expect(result).toHaveStatus(500);
    });

    it('should return an error if trying to access a sensitive survey', async () => {
      await testContext.models.Survey.create({
        id: SENSITIVE_SURVEY_ID,
        name: 'Test survey (sensitive)',
        programId: PROGRAM_ID,
        isSensitive: true,
      });

      const result = await app.post(REPORT_URL).send({
        parameters: {
          surveyId: SENSITIVE_SURVEY_ID,
        },
      });
      expect(result).toHaveStatus(500);
    });

    it('should default to filtering for 30 days of data', async () => {
      await submitSurveyForPatient(app, expectedPatient, subDays(new Date(), 35), expectedVillage);

      const result = await app.post(REPORT_URL).send({
        parameters: {
          surveyId: SURVEY_ID,
        },
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchTabularReport([]);
    });

    it('should return no data if filtering for a different village', async () => {
      const date = subDays(new Date(), 25);
      await submitSurveyForPatient(app, expectedPatient, date, expectedVillage);

      const result = await app.post(REPORT_URL).send({
        parameters: {
          surveyId: SURVEY_ID,
          village: unexpectedVillage.id,
        },
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchTabularReport([]);
    });

    it('should return data ordered by date', async () => {
      const date1 = subDays(new Date(), 25);
      const date2 = subDays(new Date(), 25);
      const date3 = subDays(new Date(), 25);
      // Submit in a different order just in case
      await submitSurveyForPatient(app, expectedPatient, date2, expectedVillage);
      await submitSurveyForPatient(app, expectedPatient, date3, expectedVillage);
      await submitSurveyForPatient(app, expectedPatient, date1, expectedVillage);

      const result = await app.post(REPORT_URL).send({
        parameters: {
          surveyId: SURVEY_ID,
        },
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchTabularReport(
        [
          {
            'Submission Time': format(getExpectedDate(date1), 'yyyy/MM/dd HH:mm a'),
          },
          {
            'Submission Time': format(getExpectedDate(date2), 'yyyy/MM/dd HH:mm a'),
          },
          {
            'Submission Time': format(getExpectedDate(date3), 'yyyy/MM/dd HH:mm a'),
          },
        ],
        { partialMatching: true },
      );
    });

    it('should return basic data for a survey', async () => {
      const date = subDays(new Date(), 25);

      const expectedDate = getExpectedDate(date);

      await submitSurveyForPatient(app, expectedPatient, date, expectedVillage);

      const [response] = await testContext.models.SurveyResponse.findAll({
        where: { surveyId: SURVEY_ID },
      });
      response.result = 807; // This is irrelevant
      response.resultText = 'Seventeen';
      await response.save();

      const result = await app.post(REPORT_URL).send({
        parameters: {
          surveyId: SURVEY_ID,
          village: expectedVillage.id,
        },
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchTabularReport([
        {
          'Patient ID': expectedPatient.displayId,
          'First name': expectedPatient.firstName,
          'Last name': expectedPatient.lastName,
          'Date of birth': format(expectedPatient.dateOfBirth, 'yyyy/MM/dd'),
          Age: 1,
          Sex: expectedPatient.sex,
          Village: expectedVillage.name,
          'Submission Time': format(expectedDate, 'yyyy/MM/dd HH:mm a'),
          'name-pde-Test1': 'Data point 1',
          'name-pde-CheckboxQ': 'Yes',
          'name-pde-DateQ': '2022/05/30',
          'name-pde-Autocomplete': expectedVillage.name,
          Result: 'Seventeen',
        },
      ]);
    });
  });
});
