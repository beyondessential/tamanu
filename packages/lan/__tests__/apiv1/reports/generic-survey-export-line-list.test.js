import { createDummyEncounter } from 'shared/demoData/patients';
import { createTestContext } from '../../utilities';
import { createPatient } from './covid-swab-lab-test-report-utils';
import { createPalauSurveys } from './palau-covid-case-report-line-list.test';

const REPORT_URL = '/v1/reports/generic-survey-export-line-list';
// const PROGRAM_ID = 'program-palaucovid19';
// const INITIAL_SURVEY_ID = 'program-palaucovid19-palaucovidinitialcasereportform';
// const FOLLOW_UP_SURVEY_ID = 'program-palaucovid19-palaucovidfollowupcasereport';
const timePart = 'T00:00:00.000Z';

const createDummySurvey = async (app, models) => {};

const submitSurveyForPatient = async (app, models, patient, date, formData) => {
  const encounter = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: patient.id }),
  );
  return await app.post('/v1/surveyResponse').send({
    surveyId: INITIAL_SURVEY_ID,
    startTime: date,
    patientId: patient.id,
    endTime: date,
    encounterId: encounter.id,
    locationId: encounter.locationId,
    departmentId: encounter.departmentId,
    answers: formData.answers,
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

  describe('Palau covid-19', () => {
    let app = null;
    let expectedPatient1 = null;
    let expectedPatient2 = null;

    beforeAll(async () => {
      const { models, baseApp } = testContext;
      app = await baseApp.asRole('practitioner');
      await createPalauSurveys(models);
      expectedPatient1 = await createPatient(models);
      expectedPatient2 = await createPatient(models);
    });

    beforeEach(async () => {
      await testContext.models.SurveyResponse.destroy({ where: {} });
    });
  });
});
