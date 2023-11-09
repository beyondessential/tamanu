import { randomReferenceDataObjects } from '@tamanu/shared/demoData/patients';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/shared/test-helpers';
import { toDateTimeString, format } from '@tamanu/shared/utils/dateTime';
import { subDays } from 'date-fns';
import { createTestContext } from '../../utilities';

const REPORT_URL = '/v1/reports/generic-survey-export-line-list';
const PROGRAM_ID = 'test-program-id';
const SURVEY_ID = 'test-survey-id';
const SENSITIVE_SURVEY_ID = 'test-survey-id-sensitive';

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
    {
      id: 'pde-Instruction',
      type: PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION,
      screenIndex: 1,
      componentIndex: 1,
    },
    { id: 'pde-Test1', type: 'Not Known', screenIndex: 1, componentIndex: 2 },
    {
      id: 'pde-CheckboxQ',
      type: PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX,
      screenIndex: 1,
      componentIndex: 1,
    },
    { id: 'pde-DateQ', type: PROGRAM_DATA_ELEMENT_TYPES.DATE, screenIndex: 3, componentIndex: 1 }, // screenIndex: 3 so should be last
    {
      id: 'pde-Autocomplete',
      type: PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE,
      config: '{"source":"ReferenceData"}',
      screenIndex: 2,
      componentIndex: 1,
    },
    {
      id: 'pde-Result',
      name: 'Result',
      type: PROGRAM_DATA_ELEMENT_TYPES.RESULT,
      screenIndex: 2,
      componentIndex: 2,
    },
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
    questions.map(({ id, config, screenIndex, componentIndex }) => ({
      dataElementId: id,
      surveyId: SURVEY_ID,
      config,
      screenIndex,
      componentIndex,
    })),
  );
};

const submitSurveyForPatient = (app, patient, date, expectedVillage) =>
  app.post('/v1/surveyResponse').send({
    surveyId: SURVEY_ID,
    startTime: toDateTimeString(date),
    patientId: patient.id,
    endTime: toDateTimeString(date),
    answers: {
      'pde-Test1': 'Data point 1',
      'pde-CheckboxQ': 'true',
      'pde-DateQ': '2022-05-30 02:37:12',
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
      await testContext.models.SurveyResponseAnswer.destroy({ where: {} });
      await testContext.models.SurveyResponse.destroy({ where: {} });
    });

    it('should return an error if no surveyId is sent', async () => {
      const result = await app.post(REPORT_URL).send({
        parameters: {},
      });
      expect(result).toHaveStatus(400);
      expect(result.body).toEqual({
        error: {
          message: 'parameter "survey" must be supplied',
        },
      });
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
      expect(result).toHaveStatus(400);
      expect(result.body).toEqual({
        error: {
          message: 'Cannot export a survey marked as "sensitive"',
        },
      });
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

    it('should not error if given an empty survey response', async () => {
      const date = subDays(new Date(), 25);
      await app.post('/v1/surveyResponse').send({
        surveyId: SURVEY_ID,
        startTime: toDateTimeString(date),
        patientId: expectedPatient.id,
        endTime: toDateTimeString(date),
        answers: {},
      });

      const result = await app.post(REPORT_URL).send({
        parameters: {
          surveyId: SURVEY_ID,
        },
      });
      expect(result).toHaveSucceeded();
    });

    it('should return data ordered by date', async () => {
      const date1 = toDateTimeString(subDays(new Date(), 25));
      const date2 = toDateTimeString(subDays(new Date(), 25));
      const date3 = toDateTimeString(subDays(new Date(), 25));

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
            'Submission Time': format(date1, 'yyyy-MM-dd hh:mm a'),
          },
          {
            'Submission Time': format(date2, 'yyyy-MM-dd hh:mm a'),
          },
          {
            'Submission Time': format(date3, 'yyyy-MM-dd hh:mm a'),
          },
        ],
        { partialMatching: true },
      );
    });

    it('should return basic data for a survey', async () => {
      const date = toDateTimeString(subDays(new Date(), 25));

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
          'Date of birth': expectedPatient.dateOfBirth,
          Age: 1,
          Sex: expectedPatient.sex,
          Village: expectedVillage.name,
          'Submission Time': format(date, 'yyyy-MM-dd hh:mm a'),
          'name-pde-CheckboxQ': 'Yes', // screenIndex: 1, componentIndex: 1
          'name-pde-Test1': 'Data point 1', // screenIndex: 1, componentIndex: 2
          'name-pde-Autocomplete': expectedVillage.name, // screenIndex: 2, componentIndex: 1
          'name-pde-DateQ': '2022-05-30', // screenIndex: 3, componentIndex: 1
          Result: 'Seventeen', // Always last
        },
      ]);
    });
  });
});
