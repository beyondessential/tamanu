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

// TODO: Unskip test once tests run against a postgresql database:
// https://linear.app/bes/issue/TAN-409/get-rid-of-sqlite
describe('Fiji NCD Primary Screening Summary', () => {
  let baseApp = null;
  let app = null;
  const expectedPatient1 = null;
  const patientAdditionalData1 = null;
  const patientAdditionalData2 = null;
  const expectedPatient2 = null;
  const village1 = null;
  const village2 = null;
  const ethnicity1 = null;
  const ethnicity2 = null;

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
      name: 'abc',
      code: 'abc',
      type: 'ethnicity',
    });

    const [patient1, patient2, patient3] = await createDummyPatients(models, [
      {
        sex: 'male',
        ethnicityId: ETHNICITY_IDS.ITAUKEI,
      },
      {
        sex: 'female',
        ethnicityId: ETHNICITY_IDS.ITAUKEI,
      },
      {
        sex: 'female',
        ethnicityId: ETHNICITY_IDS.OTHERS,
      },
    ]);

    // Day 1:
    const day1Time1 = '2021-03-12T01:00:00.133Z';
    const day1Time2 = '2021-03-12T03:00:00.133Z';

    await createCVDFormSurveyResponse(app, patient1, day1Time1);
    await createCVDReferral(app, patient1, day1Time2);

    // Should be counted twice for everything except the 'patients screened' column
    await createCVDFormSurveyResponse(app, patient2, day1Time1);
    await createBreastCancerFormSurveyResponse(app, patient2, day1Time2);

    // Should not be counted as referred as the referral is a different type
    await createCVDFormSurveyResponse(app, patient3, day1Time1);
    await createBreastCancerReferral(app, patient3, day1Time2);

    // Day 2:
    const day2 = '2021-03-13T01:00:00.133Z';
    await createBreastCancerFormSurveyResponse(app, patient1, day2);
  });

  describe('checks permissions', () => {
    it('should reject creating a report request with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post(`/v1/reports/fiji-ncd-primary-screening-summary`, {});
      expect(result).toBeForbidden();
    });
  });

  describe('returns the correct data', () => {
    it('should generate 1 row per date', async () => {
      const result = await app.post('/v1/reports/fiji-ncd-primary-screening-summary').send({});

      expect(result).toHaveSucceeded();
      // 1 for the header plus 2 content rows
      expect(result.body).toHaveLength(3);
    });

    it('should populate correct data', async () => {
      const result = await app.post('/v1/reports/fiji-ncd-primary-screening-summary').send({});
    });
  });
});
