import { randomReferenceDataObjects } from 'shared/demoData/patients';
import { fake } from 'shared/test-helpers';
import { subDays, format } from 'date-fns';
import { createTestContext } from '../../utilities';

const REPORT_URL = '/v1/reports/generic-survey-export-line-list';
const PROGRAM_ID = 'test-program-id';
const SURVEY_ID = 'test-survey-id';

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

  await models.ProgramDataElement.bulkCreate([
    {
      id: 'pde-Should not show',
      code: 'NoShow',
      name: 'This is an instruction',
      type: 'Instruction',
    },
    { id: 'pde-Test1', code: 'Test1', name: 'Test Question 1', type: 'Not Instruction' },
    { id: 'pde-Test2', code: 'Test2', name: 'Test Question 2', type: 'Not Instruction' },
  ]);

  await models.SurveyScreenComponent.bulkCreate([
    { dataElementId: 'pde-Should not show', surveyId: SURVEY_ID },
    { dataElementId: 'pde-Test1', surveyId: SURVEY_ID },
    { dataElementId: 'pde-Test2', surveyId: SURVEY_ID },
  ]);
};

const submitSurveyForPatient = (app, models, patient) =>
  app.post('/v1/surveyResponse').send({
    surveyId: SURVEY_ID,
    startTime: new Date(Date.UTC(2022, 4, 10, 3, 57)),
    patientId: patient.id,
    endTime: new Date(Date.UTC(2022, 4, 10, 4, 26)),
    answers: {
      'pde-Test1': 'Data point 1',
      'pde-Test2': 'Data point 2',
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

    it('should return no data if filtering for a different village', async () => {
      await submitSurveyForPatient(app, testContext.models, expectedPatient);

      const result = await app.post(REPORT_URL).send({
        parameters: {
          surveyId: SURVEY_ID,
          village: unexpectedVillage.id,
        },
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchTabularReport([]);
    });

    it('should return basic data for a survey', async () => {
      await submitSurveyForPatient(app, testContext.models, expectedPatient);

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
          'Date of birth': format(expectedPatient.dateOfBirth, 'yyyy-MM-dd'),
          Age: 1,
          Sex: expectedPatient.sex,
          Village: expectedVillage.name,
          'Submission Time': '2022-05-10 04:26',
          'Test Question 1': 'Data point 1',
          'Test Question 2': 'Data point 2',
        },
      ]);
    });
  });
});
