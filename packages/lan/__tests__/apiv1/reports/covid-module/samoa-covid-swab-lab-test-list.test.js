import { createDummyEncounter } from '@tamanu/shared/demoData/patients';
import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { subMinutes } from 'date-fns';
import { createTestContext } from '../../../utilities';
import {
  createCovidTestForPatient,
  createLabTests,
  createPatient,
} from './covid-swab-lab-test-report-utils';

const REPORT_URL = '/v1/reports/samoa-covid-swab-lab-test-list';
const PROGRAM_ID = 'program-samoacovid19';
const SURVEY_ID = 'program-samoacovid19-samcovidsampcollectionv2';

const REPORT_COLUMNS = [
  'Patient first name',
  'Patient last name',
  'DOB',
  'Sex',
  'Patient ID',
  'Village',
  'Nationality',
  'Ethnicity',
  'Phone Number',
  'Village recorded on sample collection form',
  'Lab request ID',
  'Lab request type',
  'Lab test type',
  'Status',
  'Result',
  'Requested by',
  'Requested date',
  'Submitted date',
  'Priority',
  'Testing laboratory',
  'Testing date',
  'Time test completed',
];

/**
 * dataRow should start at 1, row 0 contains header names
 */
function getDataForColumn(report, columnName, dataRow) {
  const columnIndex = REPORT_COLUMNS.findIndex(c => c === columnName);
  return report[dataRow][columnIndex];
}

async function createSampleCollectionSurvey(models) {
  await models.Program.create({
    id: PROGRAM_ID,
    name: '(Samoa) COVID-19',
  });

  await models.Survey.create({
    id: SURVEY_ID,
    name: '(Samoa) COVID-19 Sample Collection Form',
    programId: PROGRAM_ID,
  });

  await models.ProgramDataElement.bulkCreate([
    {
      id: 'pde-samcovidsamp02',
      code: 'samcovidsamp02',
      name: 'Phone Number',
      type: 'FreeText',
    },
    {
      id: 'pde-samcovidsamp03',
      code: 'samcovidsamp03',
      name: 'Village',
      type: 'FreeText',
    },
  ]);

  await models.SurveyScreenComponent.bulkCreate([
    { dataElementId: 'pde-samcovidsamp02', surveyId: SURVEY_ID },
    { dataElementId: 'pde-samcovidsamp03', surveyId: SURVEY_ID },
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
      'pde-samcovidsamp02': formData.phoneNumber,
      'pde-samcovidsamp03': formData.village,
    },
  });
}

describe('Samoa covid lab test report', () => {
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
      await createSampleCollectionSurvey(models);
      await createLabTests(models);
    });

    afterEach(async () => {
      await testContext.models.LabTest.destroy({ where: {} });
      await testContext.models.SurveyResponseAnswer.destroy({ where: {} });
      await testContext.models.LabRequest.destroy({ where: {} });
    });

    it('should produce the right columns', async () => {
      const phoneNumber = '123-456-7890';
      await createCovidTestForPatient(testContext.models, expectedPatient1);
      await createFormAnswerForPatient(app, testContext.models, expectedPatient1, {
        phoneNumber,
        village: 'test village',
      });
      const reportResult = await app.post(REPORT_URL).send({});
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(2);
      expect(reportResult.body[0]).toStrictEqual(REPORT_COLUMNS);
      expect(getDataForColumn(reportResult.body, 'Patient ID', 1)).toBe(expectedPatient1.displayId);
      expect(getDataForColumn(reportResult.body, 'Phone Number', 1)).toBe(phoneNumber);
    });

    it('should pick the latest answer between the current and the next lab request', async () => {
      const phoneNumber = '123-456-7890';
      await createCovidTestForPatient(testContext.models, expectedPatient1, '2022-03-01');
      await createFormAnswerForPatient(app, testContext.models, expectedPatient1, {
        formDate: '2022-03-01 10:50:28',
        phoneNumber,
        village: 'village 1',
      });
      await createFormAnswerForPatient(app, testContext.models, expectedPatient1, {
        formDate: '2022-03-02 10:50:28',
        phoneNumber,
        village: 'village 2',
      });
      await createCovidTestForPatient(testContext.models, expectedPatient1, '2022-03-03 10:50:28');
      const reportResult = await app.post(REPORT_URL).send({
        parameters: {
          fromDate: '2022-03-01',
        },
      });
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(3);
      expect(reportResult.body[0]).toStrictEqual(REPORT_COLUMNS);
      expect(getDataForColumn(reportResult.body, 'Patient ID', 1)).toBe(expectedPatient1.displayId);
      expect(
        getDataForColumn(reportResult.body, 'Village recorded on sample collection form', 1),
      ).toBe('village 2');
    });

    it('should return results for multiple patients', async () => {
      const phoneNumber = '123-456-7890';
      await createCovidTestForPatient(testContext.models, expectedPatient1);

      await createFormAnswerForPatient(app, testContext.models, expectedPatient1, {
        phoneNumber,
        village: 'patient 1 village',
        formDate: toDateTimeString(subMinutes(new Date(), 1)),
      });

      await createFormAnswerForPatient(app, testContext.models, expectedPatient1, {
        phoneNumber,
        village: 'patient 1 village 2',
        formDate: getCurrentDateTimeString(),
      });

      await createCovidTestForPatient(testContext.models, expectedPatient2);
      await createFormAnswerForPatient(app, testContext.models, expectedPatient2, {
        phoneNumber,
        village: 'patient 2 village',
      });
      const reportResult = await app.post(REPORT_URL).send({});
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(3);
      expect(reportResult.body[0]).toStrictEqual(REPORT_COLUMNS);
      expect(getDataForColumn(reportResult.body, 'Patient ID', 1)).toBe(expectedPatient1.displayId);
      expect(
        getDataForColumn(reportResult.body, 'Village recorded on sample collection form', 1),
      ).toBe('patient 1 village 2');
      expect(getDataForColumn(reportResult.body, 'Patient ID', 2)).toBe(expectedPatient2.displayId);
      expect(
        getDataForColumn(reportResult.body, 'Village recorded on sample collection form', 2),
      ).toBe('patient 2 village');
    });
  });
});
