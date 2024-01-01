import { REFERENCE_TYPES } from '@tamanu/constants';
import {
  createDummyEncounter,
  createDummyEncounterDiagnosis,
  createDummyPatient,
  randomReferenceId,
} from '@tamanu/shared/demoData/patients';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { createTestContext } from '../../utilities';
import {
  setupProgramAndSurvey,
  createCVDFormSurveyResponse,
  createBreastCancerFormSurveyResponse,
  createSNAPFormSurveyResponse,
} from './fiji-ncd-primary-screening/utils';

const ETHNICITY_IDS = {
  ITAUKEI: 'ethnicity-ITaukei',
  INDIAN: 'ethnicity-FID',
  OTHERS: 'ethnicity-others',
};

describe('Fiji statistical report for phis summary', () => {
  let ctx = null;
  let baseApp = null;
  let app = null;
  let village1 = null;
  let village2 = null;
  let medicalArea = null;

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

    medicalArea = await models.ReferenceData.create({
      id: `medicalArea-abc-${new Date().toString()}`,
      name: 'abc2',
      code: 'abc',
      type: REFERENCE_TYPES.MEDICAL_AREA,
    });

    const expectedPatient1 = await models.Patient.create(
      await createDummyPatient(models, {
        villageId: village1,
        dateOfBirth: '1950-02-01',
      }),
    );
    const expectedPatient2 = await models.Patient.create(
      await createDummyPatient(models, {
        villageId: village2,
        dateOfBirth: '2010-02-01',
      }),
    );
    await models.PatientAdditionalData.create({
      patientId: expectedPatient2.id,
      ethnicityId: ETHNICITY_IDS.OTHERS,
    });
    const expectedPatient3 = await models.Patient.create(
      await createDummyPatient(models, { dateOfBirth: '2010-02-01' }),
    );
    const expectedPatient4 = await models.Patient.create(
      await createDummyPatient(models, { dateOfBirth: '2010-02-01' }),
    );
    await models.PatientAdditionalData.create({
      patientId: expectedPatient3.id,
      ethnicityId: ETHNICITY_IDS.ITAUKEI,
      medicalAreaId: medicalArea.id,
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
     * 1960-05-02: Diagnosed with diabetes - SHOULD count as <30
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
     *
     * */

    // 2019-05-02: Had a non-CVD survey response submitted
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, '2019-05-02 00:00:00');

    // 2019-05-03: Had a CVD survey response submitted - marked 'ineligble' - no SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient1, '2019-05-03 00:00:00', {
      answerOverrides: {
        'pde-FijCVD021': 'Ineligible',
      },
    });

    // 1960-05-02: Diagnosed with diabetes
    const diagnosisEncounter0 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: '1960-05-02 00:00:00',
        patientId: expectedPatient1.id,
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: diabetesDiagnosis.id,
        encounterId: diagnosisEncounter0.id,
        date: '1960-05-02 00:00:00',
        certainty: 'suspected',
      }),
    );

    // 2020-05-02: Diagnosed with diabetes
    const diagnosisEncounter1 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: '2020-05-02 00:00:00',
        patientId: expectedPatient1.id,
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: diabetesDiagnosis.id,
        encounterId: diagnosisEncounter1.id,
        date: '2020-05-02 00:00:00',
        certainty: 'suspected',
      }),
    );

    // 2020-05-02: 1pm Had a CVD screening - no SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient1, '2020-05-02 13:00:00', {
      answerOverrides: {
        'pde-FijCVD038': 'No',
      },
    });

    // 2020-05-02: 5pm Had a CVD screening - no SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient1, '2020-05-02 17:00:00', {
      answerOverrides: {
        'pde-FijCVD038': 'No',
      },
    });

    // 2020-05-03: Had SNAP councilling - no CVD screening
    await createSNAPFormSurveyResponse(app, expectedPatient1, '2020-05-03 00:00:00', {
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
     * */

    // 2020-05-02: Diagnosed with diabetes and hypertension
    const diagnosisEncounter2 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: '2020-05-02 00:00:00',
        patientId: expectedPatient2.id,
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: diabetesDiagnosis.id,
        encounterId: diagnosisEncounter2.id,
        date: '2020-05-02 00:00:00',
        certainty: 'suspected',
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: hypertensionDiagnosis.id,
        encounterId: diagnosisEncounter2.id,
        date: '2020-05-02 00:00:00',
        certainty: 'suspected',
      }),
    );

    // 2020-05-02: Had a CVD screening - yes SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient2, '2020-05-02 00:00:00', {
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
     * */

    // 2020-05-02: Diagnosed with hypertension
    const diagnosisEncounter3 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: '2020-05-02 00:00:00',
        patientId: expectedPatient3.id,
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: hypertensionDiagnosis.id,
        encounterId: diagnosisEncounter3.id,
        date: '2020-05-02 00:00:00',
        certainty: 'suspected',
      }),
    );

    // 2020-05-02: Diagnosed with diabetes (separate encounter)
    const diagnosisEncounter4 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: '2020-05-02 00:00:00',
        patientId: expectedPatient3.id,
      }),
    );
    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: diabetesDiagnosis.id,
        encounterId: diagnosisEncounter4.id,
        date: '2020-05-02 00:00:00',
        certainty: 'suspected',
      }),
    );

    // 2020-05-02: Had a CVD screening - yes SNAP councilling
    await createCVDFormSurveyResponse(app, expectedPatient3, '2020-05-02 00:00:00', {
      answerOverrides: {
        'pde-FijCVD038': 'Yes',
      },
    });

    // 2020-05-03: Diagnosed with hypertension
    const diagnosisEncounter5 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: '2020-05-03 00:00:00',
        patientId: expectedPatient3.id,
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: hypertensionDiagnosis.id,
        encounterId: diagnosisEncounter5.id,
        date: '2020-05-03 00:00:00',
        certainty: 'suspected',
      }),
    );
    /**
     * Patient 4:
     *
     * 2020-05-02: Diagnosed with diabetes (but it's disproven)
     *
     */
    const diagnosisEncounter6 = await models.Encounter.create(
      await createDummyEncounter(models, {
        startDate: '2020-05-02 00:00:00',
        patientId: expectedPatient4.id,
      }),
    );

    await models.EncounterDiagnosis.create(
      await createDummyEncounterDiagnosis(models, {
        diagnosisId: diabetesDiagnosis.id,
        encounterId: diagnosisEncounter6.id,
        date: '2020-05-02 00:00:00',
        certainty: 'disproven',
      }),
    );
  });

  afterAll(() => ctx.close());

  describe('checks permissions', () => {
    it('should reject creating a report with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post(`/v1/reports/fiji-statistical-report-for-phis-summary`, {
        parameters: {
          fromDate: '1960-01-01',
        },
      });
      expect(result).toBeForbidden();
    });
  });

  describe('returns the correct data', () => {
    it('should sort the dates from oldest to most recent', async () => {
      const result = await app.post('/v1/reports/fiji-statistical-report-for-phis-summary').send({
        parameters: {
          fromDate: '1960-01-01',
        },
      });
      expect(result).toHaveSucceeded();
      // 2nd row, 1st column (2A) should have the most recent date in it.
      expect(result.body[1][0]).toBe('02-05-1960');
    });

    it('should return latest data per patient and latest data per patient per date', async () => {
      const result = await app.post('/v1/reports/fiji-statistical-report-for-phis-summary').send({
        parameters: {
          fromDate: '1960-01-01',
        },
      });
      expect(result).toHaveSucceeded();

      expect(result.body).toMatchTabularReport([
        {
          /** *****1960-05-02******** */
          Date: '02-05-1960',
          'Number of CVD screenings': 0,
          'Number of individuals that have received SNAP counselling': 0,
          'Number of new diabetes cases for individuals under 30': 1,
          'Number of new diabetes cases for individuals above 30': 0,
          'Number of new hypertension cases for individuals under 30': 0,
          'Number of new hypertension cases for individuals above 30': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30': 0,
          'Number of CVD screenings by Itaukei': 0,
          'Number of individuals that have received SNAP counselling by Itaukei': 0,
          'Number of new diabetes cases for individuals under 30 by Itaukei': 0,
          'Number of new diabetes cases for individuals above 30 by Itaukei': 0,
          'Number of new hypertension cases for individuals under 30 by Itaukei': 0,
          'Number of new hypertension cases for individuals above 30 by Itaukei': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by Itaukei': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by Itaukei': 0,
          'Number of CVD screenings by Fijian of Indian descent': 0,
          'Number of individuals that have received SNAP counselling by Fijian of Indian descent': 0,
          'Number of new diabetes cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new diabetes cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of new hypertension cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new hypertension cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of CVD screenings by ethnicity Other': 0,
          'Number of individuals that have received SNAP counselling by ethnicity Other': 0,
          'Number of new diabetes cases for individuals under 30 by ethnicity Other': 0,
          'Number of new diabetes cases for individuals above 30 by ethnicity Other': 0,
          'Number of new hypertension cases for individuals under 30 by ethnicity Other': 0,
          'Number of new hypertension cases for individuals above 30 by ethnicity Other': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by ethnicity Other': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by ethnicity Other': 0,
        },
        {
          /** *****2020-05-02******** */
          Date: '02-05-2020',
          'Number of CVD screenings': 3,
          'Number of individuals that have received SNAP counselling': 2,
          'Number of new diabetes cases for individuals under 30': 0,
          'Number of new diabetes cases for individuals above 30': 1,
          'Number of new hypertension cases for individuals under 30': 0,
          'Number of new hypertension cases for individuals above 30': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30': 2,
          'Number of new dual diabetes and hypertension cases for individuals above 30': 0,
          'Number of CVD screenings by Itaukei': 1,
          'Number of individuals that have received SNAP counselling by Itaukei': 1,
          'Number of new diabetes cases for individuals under 30 by Itaukei': 0,
          'Number of new diabetes cases for individuals above 30 by Itaukei': 0,
          'Number of new hypertension cases for individuals under 30 by Itaukei': 0,
          'Number of new hypertension cases for individuals above 30 by Itaukei': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by Itaukei': 1,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by Itaukei': 0,
          'Number of CVD screenings by Fijian of Indian descent': 0,
          'Number of individuals that have received SNAP counselling by Fijian of Indian descent': 0,
          'Number of new diabetes cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new diabetes cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of new hypertension cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new hypertension cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of CVD screenings by ethnicity Other': 1,
          'Number of individuals that have received SNAP counselling by ethnicity Other': 1,
          'Number of new diabetes cases for individuals under 30 by ethnicity Other': 0,
          'Number of new diabetes cases for individuals above 30 by ethnicity Other': 0,
          'Number of new hypertension cases for individuals under 30 by ethnicity Other': 0,
          'Number of new hypertension cases for individuals above 30 by ethnicity Other': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by ethnicity Other': 1,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by ethnicity Other': 0,
        },
        {
          /** *****2020-05-03******** */
          Date: '03-05-2020',
          'Number of CVD screenings': 0,
          'Number of individuals that have received SNAP counselling': 1,
          'Number of new diabetes cases for individuals under 30': 0,
          'Number of new diabetes cases for individuals above 30': 0,
          'Number of new hypertension cases for individuals under 30': 1,
          'Number of new hypertension cases for individuals above 30': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30': 0,
          'Number of CVD screenings by Itaukei': 0,
          'Number of individuals that have received SNAP counselling by Itaukei': 0,
          'Number of new diabetes cases for individuals under 30 by Itaukei': 0,
          'Number of new diabetes cases for individuals above 30 by Itaukei': 0,
          'Number of new hypertension cases for individuals under 30 by Itaukei': 1,
          'Number of new hypertension cases for individuals above 30 by Itaukei': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by Itaukei': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by Itaukei': 0,
          'Number of CVD screenings by Fijian of Indian descent': 0,
          'Number of individuals that have received SNAP counselling by Fijian of Indian descent': 0,
          'Number of new diabetes cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new diabetes cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of new hypertension cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new hypertension cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of CVD screenings by ethnicity Other': 0,
          'Number of individuals that have received SNAP counselling by ethnicity Other': 0,
          'Number of new diabetes cases for individuals under 30 by ethnicity Other': 0,
          'Number of new diabetes cases for individuals above 30 by ethnicity Other': 0,
          'Number of new hypertension cases for individuals under 30 by ethnicity Other': 0,
          'Number of new hypertension cases for individuals above 30 by ethnicity Other': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by ethnicity Other': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by ethnicity Other': 0,
        },
      ]);
    });

    it('should return correct data after filtering', async () => {
      const result = await app.post('/v1/reports/fiji-statistical-report-for-phis-summary').send({
        parameters: {
          fromDate: '1960-01-01',
          medicalArea: medicalArea.id,
        },
      });
      expect(result).toHaveSucceeded();
      /**
       * Should only return data for patient 3:
       *
       * Patient 3 - Under 30, ethnicity: ITAUKEI
       *
       * 2020-05-02: Diagnosed with hypertension
       * 2020-05-02: Diagnosed with diabetes (separate encounter)
       * 2020-05-02: Had a CVD screening - SNAP councilling
       *
       * 2020-05-03: Diagnosed with hypertension
       */

      expect(result.body).toMatchTabularReport([
        {
          /** *****2020-05-02******** */
          Date: '02-05-2020',
          'Number of CVD screenings': 1,
          'Number of individuals that have received SNAP counselling': 1,
          'Number of new diabetes cases for individuals under 30': 0,
          'Number of new diabetes cases for individuals above 30': 0,
          'Number of new hypertension cases for individuals under 30': 0,
          'Number of new hypertension cases for individuals above 30': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30': 1,
          'Number of new dual diabetes and hypertension cases for individuals above 30': 0,
          'Number of CVD screenings by Itaukei': 1,
          'Number of individuals that have received SNAP counselling by Itaukei': 1,
          'Number of new diabetes cases for individuals under 30 by Itaukei': 0,
          'Number of new diabetes cases for individuals above 30 by Itaukei': 0,
          'Number of new hypertension cases for individuals under 30 by Itaukei': 0,
          'Number of new hypertension cases for individuals above 30 by Itaukei': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by Itaukei': 1,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by Itaukei': 0,
          'Number of CVD screenings by Fijian of Indian descent': 0,
          'Number of individuals that have received SNAP counselling by Fijian of Indian descent': 0,
          'Number of new diabetes cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new diabetes cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of new hypertension cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new hypertension cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of CVD screenings by ethnicity Other': 0,
          'Number of individuals that have received SNAP counselling by ethnicity Other': 0,
          'Number of new diabetes cases for individuals under 30 by ethnicity Other': 0,
          'Number of new diabetes cases for individuals above 30 by ethnicity Other': 0,
          'Number of new hypertension cases for individuals under 30 by ethnicity Other': 0,
          'Number of new hypertension cases for individuals above 30 by ethnicity Other': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by ethnicity Other': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by ethnicity Other': 0,
        },
        {
          /** *****2020-05-03******** */
          Date: '03-05-2020',
          'Number of CVD screenings': 0,
          'Number of individuals that have received SNAP counselling': 0,
          'Number of new diabetes cases for individuals under 30': 0,
          'Number of new diabetes cases for individuals above 30': 0,
          'Number of new hypertension cases for individuals under 30': 1,
          'Number of new hypertension cases for individuals above 30': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30': 0,
          'Number of CVD screenings by Itaukei': 0,
          'Number of individuals that have received SNAP counselling by Itaukei': 0,
          'Number of new diabetes cases for individuals under 30 by Itaukei': 0,
          'Number of new diabetes cases for individuals above 30 by Itaukei': 0,
          'Number of new hypertension cases for individuals under 30 by Itaukei': 1,
          'Number of new hypertension cases for individuals above 30 by Itaukei': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by Itaukei': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by Itaukei': 0,
          'Number of CVD screenings by Fijian of Indian descent': 0,
          'Number of individuals that have received SNAP counselling by Fijian of Indian descent': 0,
          'Number of new diabetes cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new diabetes cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of new hypertension cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new hypertension cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by Fijian of Indian descent': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by Fijian of Indian descent': 0,
          'Number of CVD screenings by ethnicity Other': 0,
          'Number of individuals that have received SNAP counselling by ethnicity Other': 0,
          'Number of new diabetes cases for individuals under 30 by ethnicity Other': 0,
          'Number of new diabetes cases for individuals above 30 by ethnicity Other': 0,
          'Number of new hypertension cases for individuals under 30 by ethnicity Other': 0,
          'Number of new hypertension cases for individuals above 30 by ethnicity Other': 0,
          'Number of new dual diabetes and hypertension cases for individuals under 30 by ethnicity Other': 0,
          'Number of new dual diabetes and hypertension cases for individuals above 30 by ethnicity Other': 0,
        },
      ]);
    });
  });
});
