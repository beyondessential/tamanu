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

const ETHNICITY_IDS = {
  ITAUKEI: 'ethnicity-ITaukei',
  INDIAN: 'ethnicity-FID',
  OTHERS: 'ethnicity-others',
};

const PROPERTY_LIST = [
  'date',
  'total_cvd_responses',
  'total_snaps',
  'u30_diabetes',
  'o30_diabetes',
  'u30_hypertension',
  'o30_hypertension',
  'u30_dual',
  'o30_dual',
  'itaukei_cvd_responses',
  'itaukei_snaps',
  'itaukei_u30_diabetes',
  'itaukei_o30_diabetes',
  'itaukei_u30_hypertension',
  'itaukei_o30_hypertension',
  'itaukei_u30_dual',
  'itaukei_o30_dual',
  'fid_cvd_responses',
  'fid_snaps',
  'fid_u30_diabetes',
  'fid_o30_diabetes',
  'fid_u30_hypertension',
  'fid_o30_hypertension',
  'fid_u30_dual',
  'fid_o30_dual',
  'others_cvd_responses',
  'others_snaps',
  'others_u30_diabetes',
  'others_o30_diabetes',
  'others_u30_hypertension',
  'others_o30_hypertension',
  'others_u30_dual',
  'others_o30_dual',
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

    const expectedPatient1 = await models.Patient.create(
      await createDummyPatient(models, {
        villageId: village1,
        dateOfBirth: moment.utc().subtract(50, 'years'),
      }),
    );
    const expectedPatient2 = await models.Patient.create(
      await createDummyPatient(models, {
        villageId: village2,
        dateOfBirth: moment.utc().subtract(20, 'years'),
      }),
    );
    await models.PatientAdditionalData.create({
      patientId: expectedPatient2.id,
      ethnicityId: ETHNICITY_IDS.OTHERS,
    });
    const expectedPatient3 = await models.Patient.create(
      await createDummyPatient(models, { dateOfBirth: moment.utc().subtract(20, 'years') }),
    );
    await models.PatientAdditionalData.create({
      patientId: expectedPatient3.id,
      ethnicityId: ETHNICITY_IDS.ITAUKEI,
    });

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
     * Patient 1 - Over 30, No ethnicity
     *
     * 2019-05-02: Had a non-CVD survey response submitted
     *
     * 2019-05-03: Had a CVD survey response submitted - marked 'ineligble' - SNAP councilling
     *
     * 2020-05-02: Diagnosed with diabetes
     * 2020-05-02: 1pm: Had a CVD screening - no SNAP councilling
     * 2020-05-02: 5pm: Had a CVD screening - no SNAP councilling (shouldn't duplicate)
     *
     * 2020-05-03: Had SNAP councilling - no CVD screening
     *
     * Patient 2 - Under 30, ethnicity: OTHERS
     *
     * 2020-05-02: Diagnosed with diabetes and hypertension
     * 2020-05-02: Had a CVD screening - SNAP councilling
     *
     * Patient 3 - Under 30, ethnicity: ITAUKEI
     *
     * 2020-05-02: Diagnosed with hypertension
     * 2020-05-02: Diagnosed with diabetes (separate encounter)
     * 2020-05-02: Had a CVD screening - SNAP councilling
     *
     * 2020-05-03: Diagnosed with hypertension
     **/

    // 2019-05-02: Had a non-CVD survey response submitted
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, moment.utc('2019-05-02'));

    // 2019-05-03: Had a CVD survey response submitted - marked 'ineligble' - no SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient1, moment.utc('2019-05-03'), {
      answerOverrides: {
        'pde-FijCVD021': 'Ineligible',
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

    // 2020-05-02: 1pm Had a CVD screening - no SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient1, moment.utc('2020-05-02T13:00:00'), {
      answerOverrides: {
        'pde-FijCVD038': 'No',
      },
    });

    // 2020-05-02: 5pm Had a CVD screening - no SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient1, moment.utc('2020-05-02T17:00:00'), {
      answerOverrides: {
        'pde-FijCVD038': 'No',
      },
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

    // 2020-05-02: Had a CVD screening - yes SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient2, moment.utc('2020-05-02'), {
      answerOverrides: {
        'pde-FijCVD038': 'Yes',
      },
    });

    /*
     * Patient 3 - Under 30, ethnicity: ITAUKEI
     *
     * 2020-05-02: Diagnosed with hypertension
     * 2020-05-02: Diagnosed with diabetes (separate encounter)
     * 2020-05-02: Had a CVD screening - yes SNAP councilling
     *
     * 2020-05-03: Diagnosed with hypertension
     *
     **/

    // 2020-05-02: Diagnosed with hypertension
    const diagnosisEncounter3 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: moment.utc('2020-05-02'),
        patientId: expectedPatient3.id,
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: hypertensionDiagnosis.id,
        encounterId: diagnosisEncounter3.id,
        date: moment.utc('2020-05-02'),
      }),
    );

    // 2020-05-02: Diagnosed with diabetes (separate encounter)
    const diagnosisEncounter4 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: moment.utc('2020-05-02'),
        patientId: expectedPatient3.id,
      }),
    );
    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: diabetesDiagnosis.id,
        encounterId: diagnosisEncounter4.id,
        date: moment.utc('2020-05-02'),
      }),
    );

    // 2020-05-02: Had a CVD screening - yes SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient3, moment.utc('2020-05-02'), {
      answerOverrides: {
        'pde-FijCVD038': 'Yes',
      },
    });

    // 2020-05-03: Diagnosed with hypertension
    const diagnosisEncounter5 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: moment.utc('2020-05-03'),
        patientId: expectedPatient3.id,
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: hypertensionDiagnosis.id,
        encounterId: diagnosisEncounter5.id,
        date: moment.utc('2020-05-03'),
      }),
    );

    const hi = await ctx.sequelize.query(
      `with
      cte_patient as (
        select
          p.id,
          coalesce(ethnicity_id, '-') as ethnicity_id, -- join on NULL = NULL returns no rows
          (date_of_birth + interval '30 year') > CURRENT_DATE as under_30
        from patients p
        left JOIN patient_additional_data AS additional_data ON additional_data.id =
          (SELECT id
            FROM patient_additional_data
            WHERE patient_id = p.id
            LIMIT 1)
      )
     select
          sra.body
        from -- Only selects the last cvd survey response per patient/date_group
          (SELECT
              e.patient_id, sr4.end_time::date as date_group, max(sr4.end_time) AS max_end_time , count(*) as count_for_testing 
            FROM
              survey_responses sr4
          join encounters e on e.id = sr4.encounter_id
          where survey_id = 'program-fijincdprimaryscreening-fijicvdprimaryscreen2'
          GROUP by e.patient_id, sr4.end_time::date
        ) max_time_per_group_table
        JOIN survey_responses AS sr 
        ON sr.end_time = max_time_per_group_table.max_end_time
        left join survey_response_answers sra 
        on sra.response_id = sr.id and sra.data_element_id = 'pde-FijCVD021'
        join encounters sr_encounter
        on sr_encounter.id = sr.encounter_id and sr_encounter.patient_id = max_time_per_group_table.patient_id
        join cte_patient cp on cp.id = sr_encounter.patient_id
        where sra.body is null or sra.body <> 'Ineligible';`,
      { type: ctx.sequelize.QueryTypes.SELECT },
    );
    console.log(hi);
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
    it('should sort the dates from oldest to most recent ', async () => {
      const result = await app
        .post('/v1/reports/fiji-statistical-report-for-phis-summary')
        .send({});
      expect(result).toHaveSucceeded();
      // 2nd row, 1st column (2A) should have the most recent date in it.
      console.log(result.body);
      expect(result.body[1][0]).toBe('02-05-2020');
    });

    it('should return latest data per patient and latest data per patient per date', async () => {
      const result = await app
        .post('/v1/reports/fiji-statistical-report-for-phis-summary')
        .send({});
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(3);

      /*******2020-05-02*********/
      const expectedDetails1 = {
        date: '02-05-2020',
        total_cvd_responses: 3,
        total_snaps: 2,
        u30_diabetes: 0,
        o30_diabetes: 1,
        u30_hypertension: 0,
        o30_hypertension: 0,
        u30_dual: 2,
        o30_dual: 0,
        itaukei_cvd_responses: 1,
        itaukei_snaps: 1,
        itaukei_u30_diabetes: 0,
        itaukei_o30_diabetes: 0,
        itaukei_u30_hypertension: 0,
        itaukei_o30_hypertension: 0,
        itaukei_u30_dual: 1,
        itaukei_o30_dual: 0,
        fid_cvd_responses: 0,
        fid_snaps: 0,
        fid_u30_diabetes: 0,
        fid_o30_diabetes: 0,
        fid_u30_hypertension: 0,
        fid_o30_hypertension: 0,
        fid_u30_dual: 0,
        fid_o30_dual: 0,
        others_cvd_responses: 1,
        others_snaps: 0,
        others_u30_diabetes: 0,
        others_o30_diabetes: 0,
        others_u30_hypertension: 0,
        others_o30_hypertension: 0,
        others_u30_dual: 1,
        others_o30_dual: 0,
      };
      for (const entry of Object.entries(expectedDetails1)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 1, key)).toBe(expectedValue);
      }

      /*******2020-05-03*********/
      const expectedDetails2 = {
        date: '03-05-2020',
        total_cvd_responses: 0,
        total_snaps: 1,
        u30_diabetes: 0,
        o30_diabetes: 0,
        u30_hypertension: 1,
        o30_hypertension: 0,
        u30_dual: 0,
        o30_dual: 0,
        itaukei_cvd_responses: 0,
        itaukei_snaps: 0,
        itaukei_u30_diabetes: 0,
        itaukei_o30_diabetes: 0,
        itaukei_u30_hypertension: 1,
        itaukei_o30_hypertension: 0,
        itaukei_u30_dual: 0,
        itaukei_o30_dual: 0,
        fid_cvd_responses: 0,
        fid_snaps: 0,
        fid_u30_diabetes: 0,
        fid_o30_diabetes: 0,
        fid_u30_hypertension: 0,
        fid_o30_hypertension: 0,
        fid_u30_dual: 0,
        fid_o30_dual: 0,
        others_cvd_responses: 0,
        others_snaps: 0,
        others_u30_diabetes: 0,
        others_o30_diabetes: 0,
        others_u30_hypertension: 0,
        others_o30_hypertension: 0,
        others_u30_dual: 0,
        others_o30_dual: 0,
      };
      for (const entry of Object.entries(expectedDetails2)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 2, key)).toBe(expectedValue);
      }
    });
  });
});
