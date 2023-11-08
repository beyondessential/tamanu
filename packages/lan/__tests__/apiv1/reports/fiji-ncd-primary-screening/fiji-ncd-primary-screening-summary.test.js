import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { createTestContext } from '../../../utilities';
import {
  setupProgramAndSurvey,
  createCVDFormSurveyResponse,
  createCVDReferral,
  createBreastCancerFormSurveyResponse,
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
  'screenedRisk<10',
  'screenedRisk10-20',
  'screenedRisk20-30',
  'screenedRisk30-40',
  'screenedRisk>40',
  'screenedHighBreastCancerRisk',
  'referredNumber',
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

describe('Fiji NCD Primary Screening Summary', () => {
  let baseApp = null;
  let app = null;
  let expectedPatient1 = null;
  let expectedPatient2 = null;
  let expectedPatient3 = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    const { models } = ctx;

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

    // This patient should NOT be counted in any data as they will have answered 'Ineligible' to
    // "is this individual eligible for screening"
    const unusedPatient = await models.Patient.create(
      await createDummyPatient(models, { sex: 'female', dateOfBirth: '2021-03-01T01:00:00.133Z' }),
    );
    await models.PatientAdditionalData.create({
      patientId: unusedPatient.id,
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

    // this should not be counted, and neither should the patient
    await createCVDFormSurveyResponse(app, unusedPatient, day1Time1, {
      answerOverrides: {
        'pde-FijCVD021': 'Ineligible',
      },
    });

    // Day 2:
    const day2 = '2021-03-13T01:00:00.133Z';
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, day2, {
      resultText: undefined,
    });

    // This survey response should not be counted (but the patient still should be)
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, day2, {
      answerOverrides: {
        'pde-FijBS14': 'Ineligible',
      },
    });
  });
  afterAll(() => ctx.close());

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
        date: '12-03-2021',
        patientsScreened: 3,
        screened: 4,
        screenedMale: 1,
        screenedFemale: 3,
        'screened<30': 4,
        'screened>30': 0,
        screenedItaukei: 1,
        screenedIndian: 0,
        screenedOther: 3,
        'screenedRisk<10': 3,
        'screenedRisk10-20': 0,
        'screenedRisk20-30': 0,
        'screenedRisk30-40': 0,
        'screenedRisk>40': 0,
        screenedHighBreastCancerRisk: 1,
        referredNumber: 1,
        referredMale: 1,
        referredFemale: 0,
        'referred<30': 1,
        'referred>30': 0,
        referredItaukei: 1,
        referredIndian: 0,
        referredOther: 0,
      };
      for (const entry of Object.entries(expectedDetails1)) {
        const [key, expectedValue] = entry;
        expect(getProperty(row1, key)).toBe(expectedValue);
      }

      const row2 = result.body[2];
      const expectedDetails2 = {
        date: '13-03-2021',
        patientsScreened: 1,
        screened: 1,
        screenedMale: 1,
        screenedFemale: 0,
        'screened<30': 1,
        'screened>30': 0,
        screenedItaukei: 1,
        screenedIndian: 0,
        screenedOther: 0,
        'screenedRisk<10': 0,
        'screenedRisk10-20': 0,
        'screenedRisk20-30': 0,
        'screenedRisk30-40': 0,
        'screenedRisk>40': 0,
        screenedHighBreastCancerRisk: 0,
        referredNumber: 0,
        referredMale: 0,
        referredFemale: 0,
        'referred<30': 0,
        'referred>30': 0,
        referredItaukei: 0,
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
