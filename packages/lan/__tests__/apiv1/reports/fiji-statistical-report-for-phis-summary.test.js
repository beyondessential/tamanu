import moment from 'moment';
import {
  createDummyEncounter,
  createDummyEncounterDiagnosis,
  createDummyPatient,
  randomReferenceId,
  randomReferenceDataObjects,
} from 'shared/demoData/patients';
import { createTestContext } from '../../utilities';
import {
  setupProgramAndSurvey,
  createCVDFormSurveyResponse,
  createBreastCancerFormSurveyResponse,
  createSNAPFormSurveyResponse,
} from './fiji-ncd-primary-screening/utils';

const PROGRAM_ID = 'program-fijicovid19';
const FIJI_SAMP_SURVEY_ID = 'program-fijicovid19-fijicovidsampcollection';

const PROPERTY_LIST = [
  'date',
  'number_of_cvd_screenings',
  'received_snap_counselling',
  'diabetes_u30',
  'diabetes_o30',
  'hypertension_u30',
  'hypertension_o30',
  'dual_u30',
  'dual_o30',
  'screened_itaukei',
  'itaukei_diabetes_u30',
  'itaukei_diabetes_o30',
  'itaukei_hypertension_u30',
  'itaukei_hypertension_o30',
  'screened_fid',
  'screened_others',
  'others_diabetes_u30',
  'others_diabetes_o30',
];
const PROPERTY_TO_EXCEL_INDEX = PROPERTY_LIST.reduce((acc, prop, i) => ({ ...acc, [prop]: i }), {});

const getProperty = (result, row, prop) => result.body[row][PROPERTY_TO_EXCEL_INDEX[prop]];

describe('Covid swab lab test list', () => {
  let baseApp = null;
  let app = null;
  let village1 = null;
  let village2 = null;

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

    baseApp = ctx.baseApp;
    village1 = await randomReferenceId(models, 'village');
    village2 = await randomReferenceId(models, 'village');

    const expectedPatient1 = await models.Patient.create(
      await createDummyPatient(models, { villageId: village1 }),
    );
    const expectedPatient2 = await models.Patient.create(
      await createDummyPatient(models, { villageId: village2 }),
    );

    app = await baseApp.asRole('practitioner');

    const diabetesDiagnosis = await models.ReferenceData.create({
      type: 'icd10',
      name: 'Diabetes',
      code: 'icd10-E11',
    });

    const hypertensionDiagnosis = await models.ReferenceData.create({
      type: 'icd10',
      name: 'Hypertension',
      code: 'icd10-I10',
    });

    await setupProgramAndSurvey(models);

    /*
     * Patient 1
     *
     * 2019-05-02: Had a non-CVD survey response submitted
     *
     * 2019-05-03: Had a CVD survey response submitted - marked 'ineligble' - SNAP councilling
     *
     * 2020-05-02: Diagnosed with diabetes
     * 2020-05-02: Had a CVD screening - no SNAP councilling
     *
     * 2020-05-03: Had SNAP councilling - no CVD screening
     *
     * Patient 2
     *
     * 2020-05-02: Diagnosed with diabetes and hypertension
     * 2020-05-02: Had a CVD screening - SNAP councilling
     *
     * // TODO - test ethnicity grouping, (inc no ethnicity)
     **/

    // 2019-05-02: Had a non-CVD survey response submitted
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, moment.utc('2019-05-02'));

    // 2019-05-03: Had a CVD survey response submitted - marked 'ineligble' - SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient1, moment.utc('2019-05-03'), {
      answerOverrides: {
        'pde-FijCVD021': 'Ineligible',
        'pde-FijCVD038': 'Yes',
      },
    });

    // 2020-05-02: Diagnosed with diabetes
    const diagnosisEncounter1 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: moment.utc('2020-05-02'),
        patientId: expectedPatient1.id,
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: diabetesDiagnosis.id,
        encounterId: diagnosisEncounter1.id,
        date: moment.utc('2020-05-02'),
      }),
    );

    // 2020-05-02: Had a CVD screening - no SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient1, moment.utc('2020-05-02'), {
      'pde-FijCVD038': 'No',
    });

    // 2020-05-03: Had SNAP councilling - no CVD screening
    await createSNAPFormSurveyResponse(app, expectedPatient1, moment.utc('2020-05-03'), {
      answerOverrides: {
        'pde-FijSNAP13': 'Yes',
      },
    });

    /*
     * Patient 2
     *
     * 2020-05-02: Diagnosed with diabetes and hypertension
     * 2020-05-02: Had a CVD screening - SNAP councilling
     *
     **/

    // 2020-05-02: Diagnosed with diabetes and hypertension
    const diagnosisEncounter2 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: moment.utc('2020-05-02'),
        patientId: expectedPatient2.id,
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: diabetesDiagnosis.id,
        encounterId: diagnosisEncounter2.id,
        date: moment.utc('2020-05-02'),
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: hypertensionDiagnosis.id,
        encounterId: diagnosisEncounter2.id,
        date: moment.utc('2020-05-02'),
      }),
    );

    // 2020-05-02: Had a CVD screening - no SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient2, moment.utc('2020-05-02'), {
      'pde-FijCVD038': 'Yes',
    });
  });

  describe('checks permissions', () => {
    it('should reject creating an assistive technology device line list report with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post(
        `/v1/reports/fiji-statistical-report-for-phis-summary`,
        {},
      );
      expect(result).toBeForbidden();
    });
  });

  describe('returns the correct data', () => {
    it('should sort the dates from most recent to oldest', async () => {
      const result = await app
        .post('/v1/reports/fiji-statistical-report-for-phis-summary')
        .send({});
      expect(result).toHaveSucceeded();
      // 2nd row, 1st column (2A) should have the most recent date in it.
      console.log(result.body);
      expect(result.body[1][0]).toBe('03-05-2020');
    });

    it('should return latest data per patient and latest data per patient per date', async () => {
      const result = await app
        .post('/v1/reports/fiji-statistical-report-for-phis-summary')
        .send({});
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(3);

      /*******2020-05-03*********/
      const expectedDetails1 = {
        date: '03-05-2020',
        number_of_cvd_screenings: '0',
        received_snap_counselling: '0',
        diabetes_u30: '0',
        diabetes_o30: '0',
        hypertension_u30: '0',
        hypertension_o30: '0',
        dual_u30: '0',
        dual_o30: '0',
        screened_itaukei: '0',
        itaukei_diabetes_u30: '0',
        itaukei_diabetes_o30: '0',
        itaukei_hypertension_u30: '0',
        itaukei_hypertension_o30: '0',
        screened_fid: '0',
        screened_others: '0',
        others_diabetes_u30: '0',
        others_diabetes_o30: '0',
      };
      for (const entry of Object.entries(expectedDetails1)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 1, key)).toBe(expectedValue);
      }
    });
  });
});
