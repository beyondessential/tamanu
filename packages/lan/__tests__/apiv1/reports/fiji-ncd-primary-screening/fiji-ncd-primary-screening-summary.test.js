import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
import { createTestContext } from '../../../utilities';
import {
  setupProgramAndSurvey,
  createCVDFormSurveyResponse,
  createCVDReferral,
  createBreastCancerFormSurveyResponse,
  // createBreastCancerReferral,
} from './utils';

describe('Fiji NCD Primary Screening Summary', () => {
  let baseApp = null;
  let app = null;
  let expectedPatient1 = null;
  let patientAdditionalData1 = null;
  let patientAdditionalData2 = null;
  let expectedPatient2 = null;
  let village1 = null;
  let village2 = null;
  let ethnicity1 = null;
  let ethnicity2 = null;

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
    ethnicity1 = await models.ReferenceData.create({
      id: `ethnicity-abc-${new Date().toString()}`,
      name: 'abc',
      code: 'abc',
      type: 'ethnicity',
    });
    ethnicity2 = await models.ReferenceData.create({
      id: `ethnicity-def-${new Date().toString()}`,
      name: 'def',
      code: 'def',
      type: 'ethnicity',
    });

    expectedPatient1 = await models.Patient.create(
      await createDummyPatient(models, { villageId: village1, sex: 'male' }),
    );
    patientAdditionalData1 = await models.PatientAdditionalData.create({
      patientId: expectedPatient1.id,
      ethnicityId: ethnicity1.id,
      primaryContactNumber: '123',
    });
    expectedPatient2 = await models.Patient.create(
      await createDummyPatient(models, { villageId: village2, sex: 'female' }),
    );
    patientAdditionalData2 = await models.PatientAdditionalData.create({
      patientId: expectedPatient2.id,
      ethnicityId: ethnicity2.id,
      primaryContactNumber: '456',
    });

    app = await baseApp.asRole('practitioner');

    await setupProgramAndSurvey(models);

    const surveySubmissionTime = '2021-03-12T01:00:00.133Z';
    await createCVDFormSurveyResponse(app, expectedPatient1, surveySubmissionTime);
    await createCVDReferral(app, expectedPatient1, surveySubmissionTime);

    await createBreastCancerFormSurveyResponse(app, expectedPatient1, '2021-03-12T01:00:00.133Z');
    // await createBreastCancerReferral(app, expectedPatient1, '2021-03-12T02:00:00.133Z');
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
      expect(result.body).toHaveLength(1);
    });
  });
});
