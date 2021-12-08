import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
import { createTestContext } from '../../../utilities';
import {
  setupProgramAndSurvey,
  createCVDFormSurveyResponse,
  createCVDReferral,
  createBreastCancerFormSurveyResponse,
  createDummyPatients,
  createBreastCancerReferral,
} from './utils';

const ETHNICITY_IDS = {
  ITAUKEI: 'ethnicity-ITaukei',
  INDIAN: 'ethnicity-FID',
  OTHERS: 'ethnicity-others',
};

const PROPERTY_LIST = [
  'date',
  'patientsScreened',
  'screened',
  'screenedMale',
  'screenedFemale',
  'screened<30',
  'screened>30',
  'screenedItaukei',
  'screenedIndian',
  'screenedOther',
  'screenedRisk<5',
  'screenedRisk5-10',
  'screenedRisk10-20',
  'screenedRisk20-30',
  'screenedRisk>30',
  'referredNumber',
  'referredPercent',
  'referredMale',
  'referredFemale',
  'referred<30',
  'referred>30',
  'referredItaukei',
  'referredIndian',
  'referredOther',
];

const PROPERTY_TO_EXCEL_INDEX = PROPERTY_LIST.reduce((acc, prop, i) => ({ ...acc, [prop]: i }), {});

const getProperty = (row, prop) => row[PROPERTY_TO_EXCEL_INDEX[prop]];

// TODO: Unskip test once tests run against a postgresql database:
// https://linear.app/bes/issue/TAN-409/get-rid-of-sqlite
describe.skip('Fiji NCD Primary Screening Summary', () => {
  let baseApp = null;
  let app = null;
  let expectedPatient1 = null;
  let expectedPatient2 = null;
  let expectedPatient3 = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    const models = ctx.models;

    await models.Referral.truncate({ cascade: true });
    await models.SurveyResponseAnswer.truncate({ cascade: true });
    await models.SurveyResponse.truncate({ cascade: true });
    await models.SurveyScreenComponent.truncate({ cascade: true });
    await models.ProgramDataElement.truncate({ cascade: true });
    await models.Survey.truncate({ cascade: true });
    await models.Program.truncate({ cascade: true });
    await models.PatientAdditionalData.truncate({ cascade: true });
    await models.Patient.truncate({ cascade: true });
    await models.ReferenceData.truncate({ cascade: true });

    baseApp = ctx.baseApp;
    app = await baseApp.asRole('practitioner');

    await setupProgramAndSurvey(models);
    await models.ReferenceData.create({
      id: ETHNICITY_IDS.ITAUKEI,
      name: 'abc',
      code: 'abc',
      type: 'ethnicity',
    });
    await models.ReferenceData.create({
      id: ETHNICITY_IDS.OTHERS,
      name: 'def',
      code: 'def',
      type: 'ethnicity',
    });

    expectedPatient1 = await models.Patient.create(
      await createDummyPatient(models, { sex: 'male', dateOfBirth: '2021-03-01T01:00:00.133Z' }),
    );
    await models.PatientAdditionalData.create({
      patientId: expectedPatient1.id,
      ethnicityId: ETHNICITY_IDS.ITAUKEI,
    });
    expectedPatient2 = await models.Patient.create(
      await createDummyPatient(models, { sex: 'female', dateOfBirth: '2021-03-01T01:00:00.133Z' }),
    );
    await models.PatientAdditionalData.create({
      patientId: expectedPatient2.id,
      ethnicityId: ETHNICITY_IDS.OTHERS,
    });
    expectedPatient3 = await models.Patient.create(
      await createDummyPatient(models, { sex: 'female', dateOfBirth: '2021-03-01T01:00:00.133Z' }),
    );
    await models.PatientAdditionalData.create({
      patientId: expectedPatient3.id,
      ethnicityId: ETHNICITY_IDS.OTHERS,
    });

    app = await baseApp.asRole('practitioner');

    // Day 1:
    const day1Time1 = '2021-03-12T01:00:00.133Z';
    const day1Time2 = '2021-03-12T03:00:00.133Z';

    await createCVDFormSurveyResponse(app, expectedPatient1, day1Time1);
    await createCVDReferral(app, expectedPatient1, day1Time2);

    // Should be counted twice for everything except the 'patients screened' column
    await createCVDFormSurveyResponse(app, expectedPatient2, day1Time1);
    await createBreastCancerFormSurveyResponse(app, expectedPatient2, day1Time2);

    // Should not be counted as referred as the referral is a different type
    await createCVDFormSurveyResponse(app, expectedPatient3, day1Time1);
    await createBreastCancerReferral(app, expectedPatient3, day1Time2);

    // Day 2:
    const day2 = '2021-03-13T01:00:00.133Z';
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, day2);
  });

  describe('checks permissions', () => {
    it('should reject creating a report request with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post(`/v1/reports/fiji-ncd-primary-screening-summary`, {});
      expect(result).toBeForbidden();
    });
  });

  describe('returns the correct data', () => {
    it('should populate correct data', async () => {
      const result = await app.post('/v1/reports/fiji-ncd-primary-screening-summary').send({});

      expect(result).toHaveSucceeded();
      // 1 for the header plus 2 content rows
      expect(result.body).toHaveLength(3);

      const row1 = result.body[1];
      const expectedDetails1 = {
        date: '2021-03-13',
        patientsScreened: 1,
        screened: 1,
        screenedMale: 1,
        screenedFemale: 0,
        'screened<30': 1,
        'screened>30': 0,
        screenedItaukei: 1,
        screenedIndian: 0,
        screenedOther: 0,
        'screenedRisk<5': 0,
        'screenedRisk5-10': 0,
        'screenedRisk10-20': 0,
        'screenedRisk20-30': 0,
        'screenedRisk>30': 0,
        referredNumber: 0,
        referredPercent: '0%',
        referredMale: 0,
        referredFemale: 0,
        'referred<30': 0,
        'referred>30': 0,
        referredItaukei: 0,
        referredIndian: 0,
        referredOther: 0,
      };
      for (const entry of Object.entries(expectedDetails1)) {
        const [key, expectedValue] = entry;
        expect(getProperty(row1, key)).toBe(expectedValue);
      }

      const row2 = result.body[2];
      const expectedDetails2 = {
        date: '2021-03-12',
        patientsScreened: 3,
        screened: 4,
        screenedMale: 1,
        screenedFemale: 3,
        'screened<30': 4,
        'screened>30': 0,
        screenedItaukei: 1,
        screenedIndian: 0,
        screenedOther: 3,
        'screenedRisk<5': 3,
        'screenedRisk5-10': 0,
        'screenedRisk10-20': 0,
        'screenedRisk20-30': 0,
        'screenedRisk>30': 0,
        referredNumber: 1,
        referredPercent: '25%',
        referredMale: 1,
        referredFemale: 0,
        'referred<30': 1,
        'referred>30': 0,
        referredItaukei: 1,
        referredIndian: 0,
        referredOther: 0,
      };
      for (const entry of Object.entries(expectedDetails2)) {
        const [key, expectedValue] = entry;
        expect(getProperty(row2, key)).toBe(expectedValue);
      }
    });
  });
});
