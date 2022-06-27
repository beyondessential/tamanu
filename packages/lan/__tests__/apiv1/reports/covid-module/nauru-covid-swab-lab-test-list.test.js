import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceData,
} from 'shared/demoData/patients';
import {
  randomRecord,
} from 'shared/demoData/utilities';
import { createTestContext } from '../../../utilities';
import { createCovidTestForPatient, createLabTests } from './covid-swab-lab-test-report-utils';

const REPORT_URL = '/v1/reports/nauru-covid-swab-lab-test-list';
const PROGRAM_ID = 'program-naurucovid19';
const SURVEY_ID = 'program-naurucovid19-naurucovidtestregistration';
const timePart = 'T00:00:00.000Z';

async function createNauruSurveys(models) {
  await models.Program.create({
    id: PROGRAM_ID,
    name: 'COVID-19',
  });

  await models.Survey.create({
    id: SURVEY_ID,
    name: 'COVID-19 Testing',
    programId: PROGRAM_ID,
  });

  await models.ProgramDataElement.bulkCreate([
    { id: 'pde-NauCOVTest002', code: 'NauCOVTest002' },
    { id: 'pde-NauCOVTest003', code: 'NauCOVTest003' },
    { id: 'pde-NauCOVTest005', code: 'NauCOVTest005' },
    { id: 'pde-NauCOVTest006', code: 'NauCOVTest006' },
    { id: 'pde-NauCOVTest007', code: 'NauCOVTest007' },
    { id: 'pde-NauCOVTest008', code: 'NauCOVTest008' },
  ]);

  await models.SurveyScreenComponent.bulkCreate([
    { dataElementId: 'pde-NauCOVTest002', surveyId: SURVEY_ID },
    { dataElementId: 'pde-NauCOVTest003', surveyId: SURVEY_ID },
    { dataElementId: 'pde-NauCOVTest005', surveyId: SURVEY_ID },
    { dataElementId: 'pde-NauCOVTest006', surveyId: SURVEY_ID },
    { dataElementId: 'pde-NauCOVTest007', surveyId: SURVEY_ID },
    { dataElementId: 'pde-NauCOVTest008', surveyId: SURVEY_ID },
  ]);
}

async function submitInitialFormForPatient(app, models, patient, date, answers) {
  const encounter = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: patient.id }),
  );
  return app.post('/v1/surveyResponse').send({
    surveyId: SURVEY_ID,
    startTime: date,
    patientId: patient.id,
    endTime: date,
    encounterId: encounter.id,
    locationId: encounter.locationId,
    departmentId: encounter.departmentId,
    answers,
  });
}

describe('Nauru covid case report tests', () => {
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

  describe('reports', () => {
    let app = null;
    let facility = null;
    let village = null;
    let expectedPatient = null;
    let models = null;

    beforeAll(async () => {
      models = testContext.models;
      const { baseApp } = testContext;
      app = await baseApp.asRole('practitioner');
      facility = await randomRecord(models, 'Facility');
      village = await randomReferenceData(models, 'village');
      expectedPatient = await models.Patient.create(
        await createDummyPatient(models, { villageId: village.id }),
      );
      await createLabTests(models);
      await createNauruSurveys(models);
    });

    beforeEach(async () => {
      await testContext.models.SurveyResponse.destroy({ where: {} });
    });

    it('should return only one line per patient', async () => {
      await submitInitialFormForPatient(app, models, expectedPatient, new Date(2022, 3, 10, 4), {
        'pde-NauCOVTest002': 435355781, // 'Patient contact number'
        'pde-NauCOVTest003': 'Community', // 'Test location'
        'pde-NauCOVTest005': 'Yes', // 'Does patient have symptoms'
        'pde-NauCOVTest006': new Date(2022, 3, 5), // 'If Yes, date of first symptom onset'
        'pde-NauCOVTest007': 'Loss of smell or taste', // Symptoms
        'pde-NauCOVTest008': facility.id, // 'Health Clinic'
      });

      const labRequest = await createCovidTestForPatient(
        models,
        expectedPatient,
        new Date(2022, 3, 10, 5),
      );

      const reportResult = await app
        .post(REPORT_URL)
        .send({ parameters: { fromDate: new Date(2022, 3, 1, 4) } });
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toMatchTabularReport([
        {
          'Patient first name': expectedPatient.firstName,
          'Patient last name': expectedPatient.lastName,
          DOB: expectedPatient.dob,
          Sex: expectedPatient.sex,
          'Patient ID': expectedPatient.displayId,
          'Home sub-division': village.name,
          'Lab request ID': labRequest.displayId,
          'Lab request type': labRequest.type,
          'Lab test type': labRequest.tests?.[0],
          'Lab test method': labRequest,
          Status: labRequest.status,
          Result: labRequest.result,
          'Requested by': labRequest.requestedBy,
          'Requested date': labRequest.requestedDate,
          'Submitted date': null,
          Priority: null,
          'Testing laboratory': null,
          'Testing date': null,
          'Laboratory officer': null,
          'Sample collection time': null,
        },
      ]);
    });
  });
});
