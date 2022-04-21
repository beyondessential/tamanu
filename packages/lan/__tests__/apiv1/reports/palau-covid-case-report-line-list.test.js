import { createDummyEncounter } from 'shared/demoData/patients';
import { createTestContext } from '../../utilities';
import { createPatient } from './covid-swab-lab-test-report-utils';

const REPORT_URL = '/v1/reports/palau-covid-case-report-line-list';
const PROGRAM_ID = 'program-palaucovid19';
const INITIAL_SURVEY_ID = 'program-palaucovid19-palaucovidinitialcasereportform';
const FOLLOW_UP_SURVEY_ID = 'program-palaucovid19-palaucovidfollowupcasereport';
const timePart = 'T00:00:00.000Z';

async function createPalauSurveys(models) {
  await models.Program.create({
    id: PROGRAM_ID,
    name: '(Palau) COVID-19',
  });

  await models.Survey.create({
    id: INITIAL_SURVEY_ID,
    name: '(Palau) COVID-19 Case Report Form Initial',
    programId: PROGRAM_ID,
  });

  await models.Survey.create({
    id: FOLLOW_UP_SURVEY_ID,
    name: '(Palau) COVID-19 Case Report Form Follow Up',
    programId: PROGRAM_ID,
  });

  await models.ProgramDataElement.bulkCreate([
    { id: 'pde-PalauCOVCase2', code: 'PalauCOVCase2', name: 'Name' },
    { id: 'pde-PalauCOVCase3', code: 'PalauCOVCase3', name: 'Case report date' },
    { id: 'pde-PalauCOVCase4', code: 'PalauCOVCase4', name: 'Interview date' },
    { id: 'pde-PalauCOVCase6', code: 'PalauCOVCase6', name: 'Passport number' },
    { id: 'pde-PalauCOVCase6a', code: 'PalauCOVCase6a', name: 'Nationality' },
    { id: 'pde-PalauCOVCase7', code: 'PalauCOVCase7', name: 'Phone number' },
    { id: 'pde-PalauCOVCase8', code: 'PalauCOVCase8', name: 'Current street address' },
    { id: 'pde-PalauCOVCase10', code: 'PalauCOVCase10', name: 'Healthcare worker' },
    {
      id: 'pde-PalauCOVCase11',
      code: 'PalauCOVCase11',
      name: 'If healthcare worker, which facility',
    },
    { id: 'pde-PalauCOVCase13', code: 'PalauCOVCase13', name: 'Full name' },
    { id: 'pde-PalauCOVCase9', code: 'PalauCOVCase9', name: 'City/Hamlet' },
    { id: 'pde-PalauCOVCase14', code: 'PalauCOVCase14', name: 'Relationship to case' },
    {
      id: 'pde-PalauCOVCase16',
      code: 'PalauCOVCase16',
      name: 'Hospitalization required for COVID-19',
    },
    { id: 'pde-PalauCOVCase18', code: 'PalauCOVCase18', name: 'Vaccination status' },
    { id: 'pde-PalauCOVCase20', code: 'PalauCOVCase20', name: 'Booster/third dose date' },
    {
      id: 'pde-PalauCOVCase27',
      code: 'PalauCOVCase27',
      name: 'Exposures out of Palau in the last 14 days',
    },
    { id: 'pde-PalauCOVCase28', code: 'PalauCOVCase28', name: 'Date of arrival in Palau' },
    { id: 'pde-PalauCOVCase31', code: 'PalauCOVCase31', name: 'Risk factors' },
    { id: 'pde-PalauCOVCase33', code: 'PalauCOVCase33', name: 'Day 0 sample collected' },
    { id: 'pde-PalauCOVCase36', code: 'PalauCOVCase36', name: 'Symptomatic' },
  ]);

  await models.SurveyScreenComponent.bulkCreate([
    { dataElementId: 'pde-PalauCOVCase2', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase3', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase4', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase6', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase6a', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase7', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase8', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase10', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase11', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase13', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase9', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase14', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase16', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase18', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase20', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase27', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase28', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase31', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase33', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase36', surveyId: INITIAL_SURVEY_ID },
  ]);

  await models.ProgramDataElement.bulkCreate([
    { id: 'pde-PalauCOVCaseFUp02', code: 'PalauCOVCaseFUp02', name: 'Date Follow Up Sample Taken' },
    { id: 'pde-PalauCOVCaseFUp04', code: 'PalauCOVCaseFUp04', name: 'Symptomatic' },
    { id: 'pde-PalauCOVCaseFUp06', code: 'PalauCOVCaseFUp06', name: 'Patient outcome' },
    { id: 'pde-PalauCOVCaseFUp07', code: 'PalauCOVCaseFUp07', name: 'Date symptoms resolved' },
    { id: 'pde-PalauCOVCaseFUp08', code: 'PalauCOVCaseFUp08', name: 'Date of death' },
  ]);

  await models.SurveyScreenComponent.bulkCreate([
    { dataElementId: 'pde-PalauCOVCaseFUp02', surveyId: FOLLOW_UP_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCaseFUp04', surveyId: FOLLOW_UP_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCaseFUp06', surveyId: FOLLOW_UP_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCaseFUp07', surveyId: FOLLOW_UP_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCaseFUp08', surveyId: FOLLOW_UP_SURVEY_ID },
  ]);
}

async function submitInitialFormForPatient(app, models, patient, formData) {
  const encounter = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: patient.id }),
  );
  return await app.post('/v1/surveyResponse').send({
    surveyId: INITIAL_SURVEY_ID,
    startTime: formData.interviewDate,
    patientId: patient.id,
    endTime: formData.interviewDate,
    encounterId: encounter.id,
    locationId: encounter.locationId,
    departmentId: encounter.departmentId,
    answers: {
      'pde-PalauCOVCase2': formData.investigator,
      'pde-PalauCOVCase3': formData.caseDate,
      'pde-PalauCOVCase4': formData.interviewDate,
      'pde-PalauCOVCase6': formData.passportNumber,
      'pde-PalauCOVCase6a': formData.nationality,
      'pde-PalauCOVCase7': formData.phoneNumber,
      'pde-PalauCOVCase8': formData.currentAddress,
    },
  });
}

async function submitFollowUpFormForPatient(app, models, patient, formData) {
  const encounter = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: patient.id }),
  );
  return await app.post('/v1/surveyResponse').send({
    surveyId: FOLLOW_UP_SURVEY_ID,
    startTime: formData.sampleDate,
    patientId: patient.id,
    endTime: formData.sampleDate,
    encounterId: encounter.id,
    locationId: encounter.locationId,
    departmentId: encounter.departmentId,
    answers: {
      'pde-PalauCOVCaseFUp02': formData.sampleDate,
      'pde-PalauCOVCaseFUp04': formData.symptomatic,
      'pde-PalauCOVCaseFUp06': formData.patientOutcome,
      'pde-PalauCOVCaseFUp07': formData.dateResolved,
      'pde-PalauCOVCaseFUp08': formData.dateOfDeath,
    },
  });
}

describe('Palau covid case report tests', () => {
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
      await createPalauSurveys(models);
      expectedPatient1 = await createPatient(models);
      expectedPatient2 = await createPatient(models);
    });

    beforeEach(async () => {
      await testContext.models.SurveyResponse.destroy({ where: {} });
    });

    it('should return data correctly for each patient', async () => {
      await submitInitialFormForPatient(app, testContext.models, expectedPatient1, {
        investigator: 'Test',
        caseDate: '2022-04-10' + timePart,
        interviewDate: '2022-04-10' + timePart,
        passportNumber: 'A123450',
        nationality: 'country-Australia',
        phoneNumber: '123-123-1234',
      });

      await submitFollowUpFormForPatient(app, testContext.models, expectedPatient1, {
        sampleDate: '2022-04-15' + timePart,
        symptomatic: 'No',
        patientOutcome: 'Resolved',
        dateResolved: '2022-04-16' + timePart,
      });

      await submitInitialFormForPatient(app, testContext.models, expectedPatient2, {
        investigator: 'Test 2',
        caseDate: '2022-04-02' + timePart,
        interviewDate: '2022-04-02' + timePart,
        passportNumber: 'B92384848',
        nationality: 'country-Australia',
        phoneNumber: '555-444-3333',
      });

      const reportResult = await app.post(REPORT_URL).send({});
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(3);
      // survey responses are sorted latest first
      // patient 1 has interview date later than patient 2
      expect(reportResult.body[1][0]).toBe(expectedPatient1.firstName);
      expect(reportResult.body[1][28]).toBe('Resolved');
      expect(reportResult.body[2][0]).toBe(expectedPatient2.firstName);
    });
    it('should not include survey responses without initial form', async () => {
      const patient = await createPatient(testContext.models);
      await submitFollowUpFormForPatient(app, testContext.models, patient, {
        sampleDate: '2022-04-17' + timePart,
        symptomatic: 'Yes',
        patientOutcome: 'Unresolved',
        dateResolved: '2022-04-18' + timePart,
      });
      const reportResult = await app.post(REPORT_URL).send({});
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(1);
    });
    it('should not include follow up survey before initial survey', async () => {
      await submitInitialFormForPatient(app, testContext.models, expectedPatient1, {
        investigator: 'Test',
        caseDate: '2022-04-10' + timePart,
        interviewDate: '2022-04-10' + timePart,
        passportNumber: 'A123450',
        nationality: 'country-Australia',
        phoneNumber: '123-123-1234',
      });

      await submitFollowUpFormForPatient(app, testContext.models, expectedPatient1, {
        sampleDate: '2022-04-01' + timePart,
        symptomatic: 'No',
        patientOutcome: 'Resolved',
        dateResolved: '2022-04-16' + timePart,
      });

      await submitInitialFormForPatient(app, testContext.models, expectedPatient2, {
        investigator: 'Test 2',
        caseDate: '2022-04-02' + timePart,
        interviewDate: '2022-04-02' + timePart,
        passportNumber: 'B92384848',
        nationality: 'country-Australia',
        phoneNumber: '555-444-3333',
      });

      const reportResult = await app.post(REPORT_URL).send({});
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(3);
      // survey responses are sorted latest first
      // patient 1 has interview date later than patient 2
      expect(reportResult.body[1][0]).toBe(expectedPatient1.firstName);
      expect(reportResult.body[1][28]).toBe(null);
      expect(reportResult.body[2][0]).toBe(expectedPatient2.firstName);
    });
  });
});
