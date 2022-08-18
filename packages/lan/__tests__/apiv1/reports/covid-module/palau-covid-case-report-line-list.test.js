import { createDummyEncounter } from 'shared/demoData/patients';
import { createTestContext } from '../../../utilities';
import { MATCH_ANY } from '../../../toMatchTabularReport';
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
    { id: 'pde-PalauCOVCase2', code: 'PalauCOVCase2', type: 'FreeText' },
    { id: 'pde-PalauCOVCase2a', code: 'PalauCOVCase2a', type: 'FreeText' },
    { id: 'pde-PalauCOVCase3', code: 'PalauCOVCase3', type: 'FreeText' },
    { id: 'pde-PalauCOVCase4', code: 'PalauCOVCase4', type: 'FreeText' },
    { id: 'pde-PalauCOVCase6', code: 'PalauCOVCase6', type: 'FreeText' },
    { id: 'pde-PalauCOVCase6a', code: 'PalauCOVCase6a', type: 'FreeText' },
    { id: 'pde-PalauCOVCase7', code: 'PalauCOVCase7', type: 'FreeText' },
    { id: 'pde-PalauCOVCase8', code: 'PalauCOVCase8', type: 'FreeText' },
    { id: 'pde-PalauCOVCase10', code: 'PalauCOVCase10', type: 'FreeText' },
    {
      id: 'pde-PalauCOVCase11',
      code: 'PalauCOVCase11',
      type: 'FreeText',
    },
    { id: 'pde-PalauCOVCase13', code: 'PalauCOVCase13', type: 'FreeText' },
    { id: 'pde-PalauCOVCase9', code: 'PalauCOVCase9', type: 'FreeText' },
    { id: 'pde-PalauCOVCase14', code: 'PalauCOVCase14', type: 'FreeText' },
    {
      id: 'pde-PalauCOVCase16',
      code: 'PalauCOVCase16',
      type: 'FreeText',
    },
    { id: 'pde-PalauCOVCase18', code: 'PalauCOVCase18', type: 'FreeText' },
    { id: 'pde-PalauCOVCase20', code: 'PalauCOVCase20', type: 'FreeText' },
    {
      id: 'pde-PalauCOVCase27',
      code: 'PalauCOVCase27',
      type: 'FreeText',
    },
    { id: 'pde-PalauCOVCase28', code: 'PalauCOVCase28', type: 'FreeText' },
    { id: 'pde-PalauCOVCase31', code: 'PalauCOVCase31', type: 'FreeText' },
    { id: 'pde-PalauCOVCase33', code: 'PalauCOVCase33', type: 'FreeText' },
    { id: 'pde-PalauCOVCase36', code: 'PalauCOVCase36', type: 'FreeText' },
  ]);

  await models.SurveyScreenComponent.bulkCreate([
    { dataElementId: 'pde-PalauCOVCase2', surveyId: INITIAL_SURVEY_ID },
    { dataElementId: 'pde-PalauCOVCase2a', surveyId: INITIAL_SURVEY_ID },
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
    { id: 'pde-PalauCOVCaseFUp02', code: 'PalauCOVCaseFUp02', type: 'FreeText' },
    { id: 'pde-PalauCOVCaseFUp04', code: 'PalauCOVCaseFUp04', type: 'FreeText' },
    { id: 'pde-PalauCOVCaseFUp06', code: 'PalauCOVCaseFUp06', type: 'FreeText' },
    { id: 'pde-PalauCOVCaseFUp07', code: 'PalauCOVCaseFUp07', type: 'FreeText' },
    { id: 'pde-PalauCOVCaseFUp08', code: 'PalauCOVCaseFUp08', type: 'FreeText' },
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
      'pde-PalauCOVCase2a': formData.investigatorOther,
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
      await testContext.models.SurveyResponseAnswer.destroy({ where: {} });
      await testContext.models.SurveyResponse.destroy({ where: {} });
    });

    it('should return data correctly for each patient', async () => {
      const initialFormData1 = {
        investigator: 'Test',
        investigatorOther: 'Test (other)',
        caseDate: `2022-04-10${timePart}`,
        interviewDate: `2022-04-10${timePart}`,
        passportNumber: 'A123450',
        nationality: 'country-Australia',
        phoneNumber: '123-123-1234',
      };
      await submitInitialFormForPatient(
        app,
        testContext.models,
        expectedPatient1,
        initialFormData1,
      );

      const followUpFormData1 = {
        sampleDate: `2022-04-15${timePart}`,
        symptomatic: 'No',
        patientOutcome: 'Resolved',
        dateResolved: `2022-04-16${timePart}`,
      };
      await submitFollowUpFormForPatient(
        app,
        testContext.models,
        expectedPatient1,
        followUpFormData1,
      );

      const initialFormData2 = {
        investigator: 'Test 2',
        // investigatorOther: not answered - should be blank,
        caseDate: `2022-04-02${timePart}`,
        interviewDate: `2022-04-02${timePart}`,
        passportNumber: 'B92384848',
        nationality: 'country-Australia',
        phoneNumber: '555-444-3333',
      };
      await submitInitialFormForPatient(
        app,
        testContext.models,
        expectedPatient2,
        initialFormData2,
      );

      const reportResult = await app
        .post(REPORT_URL)
        .send({ parameters: { fromDate: new Date(2022, 3, 1, 4) } });
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toMatchTabularReport([
        // survey responses are sorted latest first
        // patient 1 has interview date later than patient 2
        {
          'Case ID': initialFormData1.passportNumber,
          'Case investigator': initialFormData1.investigator,
          'Case investigator (If other)': initialFormData1.investigatorOther,
          EpiWeek: null,
          'Case report date': initialFormData1.caseDate,
          'Interview date': initialFormData1.interviewDate,
          'Hospital No.': expectedPatient1.displayId,
          'Passport number': initialFormData1.passportNumber,
          'Last name': expectedPatient1.lastName,
          'First name': expectedPatient1.firstName,
          'Middle name': expectedPatient1.middleName,
          DOB: MATCH_ANY,
          Age: MATCH_ANY,
          Sex: expectedPatient1.sex,
          Nationality: initialFormData1.nationality,
          'Street address': null,
          'City/Hamlet': null,
          State: null,
          'Phone number 1': initialFormData1.phoneNumber,
          'Phone number 2': null,
          'Healthcare worker': null,
          'If HCW, specify HCF': null,
          'Respondant name': null,
          'Respondant relationship to case': null,
          'Hospitalization required': null,
          'Vaccination status': null,
          'Booster/third dose date': null,
          'Has the case traveled in the past 14 days': null,
          'Arrival date in Palau': null,
          'Risk factors': null,
          'Day 0 sample collected': null,
          'Symptomatic on day 0': null,
          Reinfection: null,

          // follow up survey
          'Day 5 sample collected': followUpFormData1.sampleDate,
          'Symptomatic on day 5': followUpFormData1.symptomatic,
          'Patient outcome': followUpFormData1.patientOutcome,
          'If recovered, date': followUpFormData1.dateResolved,
          'If dead, date': null,
        },
        {
          'Case ID': initialFormData2.passportNumber,
          'Case investigator': initialFormData2.investigator,
          'Case investigator (If other)': null,
          EpiWeek: null,
          'Case report date': initialFormData2.caseDate,
          'Interview date': initialFormData2.interviewDate,
          'Hospital No.': expectedPatient2.displayId,
          'Passport number': initialFormData2.passportNumber,
          'Last name': expectedPatient2.lastName,
          'First name': expectedPatient2.firstName,
          'Middle name': expectedPatient2.middleName,
          DOB: MATCH_ANY,
          Age: MATCH_ANY,
          Sex: expectedPatient2.sex,
          Nationality: initialFormData2.nationality,
          'Street address': null,
          'City/Hamlet': null,
          State: null,
          'Phone number 1': initialFormData2.phoneNumber,
          'Phone number 2': null,
          'Healthcare worker': null,
          'If HCW, specify HCF': null,
          'Respondant name': null,
          'Respondant relationship to case': null,
          'Hospitalization required': null,
          'Vaccination status': null,
          'Booster/third dose date': null,
          'Has the case traveled in the past 14 days': null,
          'Arrival date in Palau': null,
          'Risk factors': null,
          'Day 0 sample collected': null,
          'Symptomatic on day 0': null,
          Reinfection: null,

          // follow up survey
          'Day 5 sample collected': null,
          'Symptomatic on day 5': null,
          'Patient outcome': null,
          'If recovered, date': null,
          'If dead, date': null,
        },
      ]);
    });

    it('should not include survey responses without initial form', async () => {
      const patient = await createPatient(testContext.models);
      await submitFollowUpFormForPatient(app, testContext.models, patient, {
        sampleDate: `2022-04-17${timePart}`,
        symptomatic: 'Yes',
        patientOutcome: 'Unresolved',
        dateResolved: `2022-04-18${timePart}`,
      });
      const reportResult = await app.post(REPORT_URL).send({});
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(1);
    });

    it('should not include follow up survey before initial survey', async () => {
      await submitInitialFormForPatient(app, testContext.models, expectedPatient1, {
        investigator: 'Test',
        caseDate: `2022-04-10${timePart}`,
        interviewDate: `2022-04-10${timePart}`,
        passportNumber: 'A123450',
        nationality: 'country-Australia',
        phoneNumber: '123-123-1234',
      });

      await submitFollowUpFormForPatient(app, testContext.models, expectedPatient1, {
        sampleDate: `2022-04-01${timePart}`,
        symptomatic: 'No',
        patientOutcome: 'Resolved',
        dateResolved: `2022-04-16${timePart}`,
      });

      await submitInitialFormForPatient(app, testContext.models, expectedPatient2, {
        investigator: 'Test 2',
        caseDate: `2022-04-02${timePart}`,
        interviewDate: `2022-04-02${timePart}`,
        passportNumber: 'B92384848',
        nationality: 'country-Australia',
        phoneNumber: '555-444-3333',
      });

      const reportResult = await app
        .post(REPORT_URL)
        .send({ parameters: { fromDate: new Date(2022, 3, 1, 4) } });
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toMatchTabularReport(
        // survey responses are sorted latest first
        // patient 1 has interview date later than patient 2
        [
          {
            'First name': expectedPatient1.firstName,
            'Day 5 sample collected': null,
          },
          {
            'First name': expectedPatient2.firstName,
          },
        ],
        // Note: this means that keys not specified above will not be tested
        { partialMatching: true },
      );
    });

    it('should return only one line per patient', async () => {
      await submitInitialFormForPatient(app, testContext.models, expectedPatient1, {
        investigator: 'Test',
        caseDate: `2022-04-02${timePart}`,
        interviewDate: `2022-04-02${timePart}`,
        passportNumber: 'B92384848',
        nationality: 'country-Australia',
        phoneNumber: '555-444-3333',
      });
      await submitInitialFormForPatient(app, testContext.models, expectedPatient1, {
        investigator: 'Test 2',
        caseDate: `2022-04-10${timePart}`,
        interviewDate: `2022-04-10${timePart}`,
        passportNumber: 'A123450',
        nationality: 'country-Australia',
        phoneNumber: '123-123-1234',
      });

      await submitFollowUpFormForPatient(app, testContext.models, expectedPatient1, {
        sampleDate: `2022-04-15${timePart}`,
        symptomatic: 'No',
        patientOutcome: 'Resolved',
        dateResolved: `2022-04-16${timePart}`,
      });

      const reportResult = await app
        .post(REPORT_URL)
        .send({ parameters: { fromDate: new Date(2022, 3, 1, 4) } });
      expect(reportResult).toHaveSucceeded();
      expect(reportResult.body).toHaveLength(2);
      expect(reportResult.body).toMatchTabularReport(
        [
          {
            'Case investigator': 'Test 2',
            'First name': expectedPatient1.firstName,
            'Patient outcome': 'Resolved',
          },
        ],
        // Note: this means that keys not specified above will not be tested
        { partialMatching: true },
      );
    });
  });
});
