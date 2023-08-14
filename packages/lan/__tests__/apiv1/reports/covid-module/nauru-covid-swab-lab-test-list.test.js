import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceData,
} from 'shared/demoData/patients';
import { randomRecord } from 'shared/demoData/utilities';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_CONFIG } from '@tamanu/constants';
import { toDateTimeString } from 'shared/utils/dateTime';
import { format } from 'shared/utils/dateTime';
import { createTestContext } from '../../../utilities';
import {
  createCovidTestForPatient,
  createLabTests,
  LAB_METHOD_NAME,
  LAB_CATEGORY_NAME,
} from './covid-swab-lab-test-report-utils';

const REPORT_URL = '/v1/reports/nauru-covid-swab-lab-test-list';
const PROGRAM_ID = 'program-naurucovid19';
const SURVEY_ID = 'program-naurucovid19-naurucovidtestregistration';

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
    { id: 'pde-NauCOVTest002', code: 'NauCOVTest002', type: 'FreeText' },
    { id: 'pde-NauCOVTest003', code: 'NauCOVTest003', type: 'FreeText' },
    { id: 'pde-NauCOVTest005', code: 'NauCOVTest005', type: 'FreeText' },
    { id: 'pde-NauCOVTest006', code: 'NauCOVTest006', type: 'FreeText' },
    { id: 'pde-NauCOVTest007', code: 'NauCOVTest007', type: 'FreeText' },
    {
      id: 'pde-NauCOVTest008',
      code: 'NauCOVTest008',
      type: 'Autocomplete',
    },
  ]);

  await models.SurveyScreenComponent.bulkCreate([
    { dataElementId: 'pde-NauCOVTest002', surveyId: SURVEY_ID },
    { dataElementId: 'pde-NauCOVTest003', surveyId: SURVEY_ID },
    { dataElementId: 'pde-NauCOVTest005', surveyId: SURVEY_ID },
    { dataElementId: 'pde-NauCOVTest006', surveyId: SURVEY_ID },
    { dataElementId: 'pde-NauCOVTest007', surveyId: SURVEY_ID },
    { dataElementId: 'pde-NauCOVTest008', surveyId: SURVEY_ID, config: '{"source": "Facility"}' },
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
      // Note: can't use cascade here or it'll delete the data created in beforeAll
      await testContext.models.SurveyResponseAnswer.destroy({ where: {} });
      await testContext.models.SurveyResponse.destroy({ where: {} });
      await testContext.models.LabTest.destroy({ where: {} });
      await testContext.models.LabRequest.destroy({ where: {} });
    });

    it('should filter by sample time', async () => {
      await submitInitialFormForPatient(app, models, expectedPatient, new Date(2022, 3, 10, 4), {
        'pde-NauCOVTest002': 435355781, // 'Patient contact number'
        'pde-NauCOVTest003': 'Community', // 'Test location'
        'pde-NauCOVTest005': 'Yes', // 'Does patient have symptoms'
        'pde-NauCOVTest006': 'dateOfFirstSymptom', // 'If Yes, date of first symptom onset'
        'pde-NauCOVTest007': 'Loss of smell or taste', // Symptoms
        'pde-NauCOVTest008': facility.id, // 'Health Clinic'
      });

      await createCovidTestForPatient(
        models,
        expectedPatient,
        new Date(2022, 3, 10, 5),
        {
          laboratoryOfficer: 'Officer Number 8',
          result: 'Positive',
        },
        { sampleTime: toDateTimeString(new Date(2022, 3, 15, 5)) },
      );

      const reportResult = await app.post(REPORT_URL).send({
        parameters: {
          fromDate: new Date(2022, 3, 1, 4),
          toDate: new Date(2022, 3, 12, 4),
        },
      });
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toMatchTabularReport([]);
    });

    it('should return only one line per patient', async () => {
      await submitInitialFormForPatient(app, models, expectedPatient, new Date(2022, 3, 10, 4), {
        'pde-NauCOVTest002': 435355781, // 'Patient contact number'
        'pde-NauCOVTest003': 'Community', // 'Test location'
        'pde-NauCOVTest005': 'Yes', // 'Does patient have symptoms'
        'pde-NauCOVTest006': 'dateOfFirstSymptom', // 'If Yes, date of first symptom onset'
        'pde-NauCOVTest007': 'Loss of smell or taste', // Symptoms
        'pde-NauCOVTest008': facility.id, // 'Health Clinic'
      });

      const { labRequest, labTest } = await createCovidTestForPatient(
        models,
        expectedPatient,
        new Date(2022, 3, 10, 5),
        {
          laboratoryOfficer: 'Officer Number 8',
          result: 'Positive',
        },
        {
          sampleTime: toDateTimeString(new Date(2022, 3, 15, 5)),
        },
      );

      const labTestType = await models.LabTestType.findByPk(labTest.labTestTypeId);

      const reportResult = await app
        .post(REPORT_URL)
        .send({ parameters: { fromDate: new Date(2022, 3, 12, 4) } });
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toMatchTabularReport([
        {
          'Patient first name': expectedPatient.firstName,
          'Patient last name': expectedPatient.lastName,
          DOB: format(expectedPatient.dateOfBirth, 'yyyy/MM/dd'),
          Sex: expectedPatient.sex,
          'Patient ID': expectedPatient.displayId,
          'Home sub-division': village.name,
          'Lab request ID': labRequest.displayId,
          'Lab request type': LAB_CATEGORY_NAME,
          'Lab test type': labTestType.name,
          'Lab test method': LAB_METHOD_NAME,
          Status: LAB_REQUEST_STATUS_CONFIG[LAB_REQUEST_STATUSES.RECEPTION_PENDING]?.label,
          Result: 'Positive',
          'Requested by': null,
          'Requested date': format(labRequest.requestedDate, 'yyyy/MM/dd'),
          'Submitted date': format(labTest.date, 'yyyy/MM/dd'),
          Priority: null,
          'Testing laboratory': null,
          'Testing date': format(labTest.completedDate, 'yyyy/MM/dd'),
          'Laboratory officer': 'Officer Number 8',
          'Sample collection date': format(labRequest.sampleTime, 'yyyy/MM/dd'),
          'Sample collection time': format(labRequest.sampleTime, 'hh:mm a'),
          'Patient contact number': '435355781',
          'Test location': 'Community',
          'Does patient have symptoms': 'Yes',
          'If Yes, date of first symptom onset': 'dateOfFirstSymptom',
          Symptoms: 'Loss of smell or taste',
          'Health Clinic': facility.name,
        },
      ]);
    });
  });
});
