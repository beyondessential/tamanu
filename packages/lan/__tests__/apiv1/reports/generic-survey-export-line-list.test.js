import { createDummyEncounter } from 'shared/demoData/patients';
import { createTestContext } from '../../utilities';
import { createPatient } from './covid-swab-lab-test-report-utils';

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

const submitSurveyForPatient = async (app, models, patient) => {
  const encounter = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: patient.id }),
  );
  return await app.post('/v1/surveyResponse').send({
    surveyId: SURVEY_ID,
    startTime: new Date(),
    patientId: patient.id,
    endTime: new Date(),
    answers: {
      'pde-Test1': 'Data point 1',
      'pde-Test2': 'Data point 2',
    },
  });
};

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
    let expectedPatient1 = null;
    let expectedPatient2 = null;

    beforeAll(async () => {
      const { models, baseApp } = testContext;
      app = await baseApp.asRole('practitioner');
      await createDummySurvey(models);
      expectedPatient1 = await createPatient(models);
      expectedPatient2 = await createPatient(models);
    });

    beforeEach(async () => {
      await testContext.models.SurveyResponse.destroy({ where: {} });
    });

    it('should return basic data for a survey', async () => {
      await submitSurveyForPatient(app, testContext.models, expectedPatient1);

      const result = await app.post(REPORT_URL).send({
        parameters: {
          surveyId: SURVEY_ID,
          // location: expectedLocation.id,
          // department: expectedDepartment1.id, // Historical department filtered for
        },
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchTabularReport([
        {
          'Patient ID': expectedPatient1.displayId,
          'First name': expectedPatient1.firstName,
          'Last name': expectedPatient1.lastName,
          'Date of birth': 'asd',
          Age: 1,
          Sex: expectedPatient1.sex,
          Village: 'asd',
          'Submission Time': 'asd',
          'Test Question 1': 'Data point 1',
          'Test Question 2': 'Data point 2',
        },
      ]);
    });
  });
});
