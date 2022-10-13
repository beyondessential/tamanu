import { createDummyEncounter } from 'shared/demoData/patients';
import { subMinutes } from 'date-fns';
import { getCurrentDateTimeString, toDateTimeString } from 'shared/utils/dateTime';
import { createTestContext } from '../../../utilities';
import {
  createCovidTestForPatient,
  createLabTests,
  createPatient,
} from './covid-swab-lab-test-report-utils';

const REPORT_URL = '/v1/reports/fiji-traveller-covid-lab-test-list';
const PROGRAM_ID = 'program-fijicovidtourism';
const SURVEY_ID = 'program-fijicovidtourism-fijicovidtravform';

const REPORT_COLUMNS = [
  'Patient first name',
  'Patient last name',
  'DOB',
  'Sex',
  'Patient ID',
  'Lab request ID',
  'Lab request type',
  'Lab test type',
  'Lab test method',
  'Status',
  'Result',
  'Requested by',
  'Facility of user',
  'Date of sample',
  'Time of sample',
  'Requested date',
  'Submitted date',
  'Priority',
  'Testing laboratory',
  'Testing date',
  'Name of the facility where test is being conducted (hotel, resort or private testing facility)',
  'Address in Fiji',
  'Sub-division of address',
  'Phone contact',
  'Email address (for results certificate)',
  'Symptoms status',
  'Date of first symptom',
  'Symptoms',
  'Name of person conducting the test',
  'International traveller or non-international traveller',
  'Hotel or international border worker',
  'Passport number',
  'Nationality on passport',
  'Purpose of test for international traveller',
  'Date of arrival in Fiji',
  'Country of travel origin',
  'Arrival flight number or vessel name',
  'Departure date',
  'Departure flight number or vessel name',
  'Destination',
  'Brand of Rapid Antigen Test',
  'Reason for test',
];

/**
 * dataRow should start at 1, row 0 contains header names
 */
function getDataForColumn(report, columnName, dataRow) {
  const columnIndex = REPORT_COLUMNS.findIndex(c => c === columnName);
  return report[dataRow][columnIndex];
}

async function createTravellerSurvey(models) {
  await models.Program.create({
    id: PROGRAM_ID,
    name: '(Fiji) COVID-19 Tourism',
  });

  await models.Survey.create({
    id: SURVEY_ID,
    name: '(Fiji) Traveller Registration Form',
    programId: PROGRAM_ID,
  });

  await models.ProgramDataElement.bulkCreate([
    {
      id: 'pde-FijCOVRDT001',
      code: 'FijCOVRDT001',
      name: 'Name of person conducting the test',
      type: 'FreeText',
    },
    {
      id: 'pde-FijCOVRDT002',
      code: 'FijCOVRDT002',
      name: 'International traveller or non-international traveller',
      type: 'FreeText',
    },
    {
      id: 'pde-FijCOVRDT002a',
      code: 'FijCOVRDT002a',
      name: 'Hotel or international border worker',
      type: 'FreeText',
    },
    {
      id: 'pde-FijCOVRDT003',
      code: 'FijCOVRDT003',
      name:
        'Name of the facility where test is being conducted (hotel, resort or private testing facility)',
      type: 'FreeText',
    },
    {
      id: 'pde-FijCOVRDT003b',
      code: 'FijCOVRDT003b',
      name: 'Brand of Rapid Antigen Test',
      type: 'FreeText',
    },
    {
      id: 'pde-FijCOVRDT004',
      code: 'FijCOVRDT004',
      name: 'Purpose of test for international traveller',
      type: 'FreeText',
    },
    { id: 'pde-FijCOVRDT005', code: 'FijCOVRDT005', name: 'Passport number', type: 'FreeText' },
    { id: 'pde-FijCOVRDT007', code: 'FijCOVRDT007', name: 'Phone contact', type: 'FreeText' },
    {
      id: 'pde-FijCOVRDT008',
      code: 'FijCOVRDT008',
      name: 'Email address (for results certificate)',
      type: 'FreeText',
    },
    { id: 'pde-FijCOVRDT008a', code: 'FijCOVRDT008a', name: 'Address in Fiji', type: 'FreeText' },
    {
      id: 'pde-FijCOVRDT008b',
      code: 'FijCOVRDT008b',
      name: 'Sub-division of address',
      type: 'FreeText',
    },
    { id: 'pde-FijCOVRDT009', code: 'FijCOVRDT009', name: 'Travel Details', type: 'FreeText' },
    {
      id: 'pde-FijCOVRDT010',
      code: 'FijCOVRDT010',
      name: 'Date of arrival in Fiji',
      type: 'FreeText',
    },
    {
      id: 'pde-FijCOVRDT011',
      code: 'FijCOVRDT011',
      name: 'Arrival flight number or vessel name',
      type: 'FreeText',
    },
    {
      id: 'pde-FijCOVRDT012',
      code: 'FijCOVRDT012',
      name: 'Country of travel origin',
      type: 'FreeText',
    },
    { id: 'pde-FijCOVRDT012a', code: 'FijCOVRDT012a', name: 'Reason for test', type: 'FreeText' },
    { id: 'pde-FijCOVRDT013', code: 'FijCOVRDT013', name: 'Departure date', type: 'FreeText' },
    {
      id: 'pde-FijCOVRDT014',
      code: 'FijCOVRDT014',
      name: 'Departure flight number or vessel name',
      type: 'FreeText',
    },
    { id: 'pde-FijCOVRDT015', code: 'FijCOVRDT015', name: 'Destination', type: 'FreeText' },
    { id: 'pde-FijCOVRDT016', code: 'FijCOVRDT016', name: 'Symptoms status', type: 'FreeText' },
    {
      id: 'pde-FijCOVRDT017',
      code: 'FijCOVRDT017',
      name: 'Date of first symptom',
      type: 'FreeText',
    },
    { id: 'pde-FijCOVRDT018', code: 'FijCOVRDT018', name: 'Symptoms', type: 'FreeText' },
    {
      id: 'pde-PalauCOVSamp7',
      code: 'PalauCOVSamp7',
      name: 'Nationality on passport',
      type: 'FreeText',
    },
  ]);

  await models.SurveyScreenComponent.bulkCreate([
    { dataElementId: 'pde-FijCOVRDT001', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT002', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT002a', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT003', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT003b', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT004', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT005', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT007', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT008', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT008a', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT008b', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT009', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT010', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT011', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT012', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT012a', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT013', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT014', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT015', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT016', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT017', surveyId: SURVEY_ID },
    { dataElementId: 'pde-FijCOVRDT018', surveyId: SURVEY_ID },
    { dataElementId: 'pde-PalauCOVSamp7', surveyId: SURVEY_ID },
  ]);
}

async function createFormAnswerForPatient(app, models, patient, formData) {
  if (!formData.formDate) {
    formData.formDate = getCurrentDateTimeString();
  }
  const encounter = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: patient.id }),
  );

  return app.post('/v1/surveyResponse').send({
    surveyId: SURVEY_ID,
    startTime: formData.formDate,
    patientId: patient.id,
    endTime: formData.formDate,
    encounterId: encounter.id,
    locationId: encounter.locationId,
    departmentId: encounter.departmentId,
    answers: {
      'pde-FijCOVRDT012a': formData.testReason,
      'pde-FijCOVRDT003b': formData.testBrand,
    },
  });
}

describe('Fiji traveller covid lab test report', () => {
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
    let expectedPatient1 = null;
    let expectedPatient2 = null;
    beforeAll(async () => {
      const { models, baseApp } = testContext;
      app = await baseApp.asRole('practitioner');
      expectedPatient1 = await createPatient(models);
      expectedPatient2 = await createPatient(models);
      await createTravellerSurvey(models);
      await createLabTests(models);
    });

    afterEach(async () => {
      await testContext.models.LabTest.destroy({ where: {} });
      await testContext.models.LabRequest.destroy({ where: {} });
      await testContext.models.SurveyResponseAnswer.destroy({ where: {} });
    });

    it('should produce the right columns', async () => {
      const testBrand = 'Rapid Test';
      await createCovidTestForPatient(testContext.models, expectedPatient1);
      await createFormAnswerForPatient(app, testContext.models, expectedPatient1, {
        testBrand,
        testReason: 'first test',
      });
      const reportResult = await app.post(REPORT_URL).send({});
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(2);
      expect(reportResult.body[0]).toStrictEqual(REPORT_COLUMNS);
      expect(getDataForColumn(reportResult.body, 'Patient ID', 1)).toBe(expectedPatient1.displayId);
      expect(getDataForColumn(reportResult.body, 'Brand of Rapid Antigen Test', 1)).toBe(testBrand);
    });

    it('should pick the latest answer between the current and the next lab request', async () => {
      const testBrand = 'Rapid Test';
      await createCovidTestForPatient(testContext.models, expectedPatient1, '2022-03-01');
      await createFormAnswerForPatient(app, testContext.models, expectedPatient1, {
        formDate: '2022-03-01 00:00:00',
        testBrand,
        testReason: 'first test',
      });
      await createFormAnswerForPatient(app, testContext.models, expectedPatient1, {
        formDate: '2022-03-02 00:00:00',
        testBrand,
        testReason: 'second test',
      });
      await createCovidTestForPatient(testContext.models, expectedPatient1, '2022-03-03');
      const reportResult = await app.post(REPORT_URL).send({
        parameters: { fromDate: '2022-02-15 00:00:00', toDate: '2022-03-15 00:00:00' },
      });
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(3);
      expect(reportResult.body[0]).toStrictEqual(REPORT_COLUMNS);
      expect(getDataForColumn(reportResult.body, 'Patient ID', 1)).toBe(expectedPatient1.displayId);
      expect(getDataForColumn(reportResult.body, 'Reason for test', 1)).toBe('second test');
    });

    it('should return results for multiple patients', async () => {
      const testBrand = 'Rapid Test';
      await createCovidTestForPatient(testContext.models, expectedPatient1);
      await createFormAnswerForPatient(app, testContext.models, expectedPatient1, {
        testBrand,
        testReason: 'first test',
        formDate: toDateTimeString(subMinutes(new Date(), 1)),
      });
      await createFormAnswerForPatient(app, testContext.models, expectedPatient1, {
        testBrand,
        testReason: 'second test',
        formDate: getCurrentDateTimeString(),
      });
      await createCovidTestForPatient(testContext.models, expectedPatient2);
      await createFormAnswerForPatient(app, testContext.models, expectedPatient2, {
        testBrand,
        testReason: 'first test',
      });
      const reportResult = await app.post(REPORT_URL).send({});
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(3);
      expect(reportResult.body[0]).toStrictEqual(REPORT_COLUMNS);
      expect(getDataForColumn(reportResult.body, 'Patient ID', 1)).toBe(expectedPatient1.displayId);
      expect(getDataForColumn(reportResult.body, 'Reason for test', 1)).toBe('second test');
      expect(getDataForColumn(reportResult.body, 'Patient ID', 2)).toBe(expectedPatient2.displayId);
      expect(getDataForColumn(reportResult.body, 'Reason for test', 2)).toBe('first test');
    });
  });
});
