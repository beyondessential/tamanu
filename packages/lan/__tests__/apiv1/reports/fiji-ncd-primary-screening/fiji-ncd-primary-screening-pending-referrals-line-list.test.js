import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
import { createTestContext } from '../../../utilities';
import {
  setupProgramAndSurvey,
  createCVDFormSurveyResponse,
  createCVDReferral,
  createBreastCancerFormSurveyResponse,
  createBreastCancerReferral,
} from './utils';

describe('Fiji NCD Primary Screening Pending Referrals line list', () => {
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

    await models.SurveyResponseAnswer.truncate({ cascade: true });
    await models.SurveyResponse.truncate({ cascade: true });
    await models.ProgramDataElement.truncate({ cascade: true });
    await models.Survey.truncate({ cascade: true });
    await models.Program.truncate({ cascade: true });

    baseApp = ctx.baseApp;
    village1 = await randomReferenceId(models, 'village');
    village2 = await randomReferenceId(models, 'village');
    ethnicity1 = await models.ReferenceData.create({
      id: 'ethnicity-abc',
      name: 'abc',
      code: 'abc',
      type: 'ethnicity',
    });
    ethnicity2 = await models.ReferenceData.create({
      id: 'ethnicity-def',
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

    // CVD referral on 2021-03-12 => should generate 1 row
    await createCVDFormSurveyResponse(app, expectedPatient1, '2021-03-12T01:00:00.133Z');
    await createCVDReferral(app, expectedPatient1, '2021-03-12T02:00:00.133Z');

    // Breast Cancer referral on 2021-03-12 => should generate 0 row because this is not the latest Breast Cancer referral
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, '2021-03-12T01:00:00.133Z');
    await createBreastCancerReferral(app, expectedPatient1, '2021-03-12T02:00:00.133Z');

    // Another Breast Cancer referral on 2021-03-12 => should generate 1 row because this is the latest Breast Cancer referral
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, '2021-03-12T03:00:00.133Z');
    await createBreastCancerReferral(app, expectedPatient1, '2021-03-12T04:00:00.133Z');

    // Breast Cancer referral on 2021-03-13 => should generate 1 row
    await createBreastCancerFormSurveyResponse(app, expectedPatient2, '2021-03-13T01:00:00.133Z');
    await createBreastCancerReferral(app, expectedPatient2, '2021-03-13T02:00:00.133Z');

    // Form submission but no referral submitted on 2021-03-14 => should not generate any row because there's now referral
    await createBreastCancerFormSurveyResponse(app, expectedPatient2, '2021-03-14T01:00:00.133Z');
  });

  describe('checks permissions', () => {
    it('should reject creating a report request with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post(
        `/v1/reports/fiji-ncd-primary-screening-pending-referrals-line-list`,
        {},
      );
      expect(result).toBeForbidden();
    });
  });

  describe('returns the correct data', () => {
    it('should generate a row for latest pending referrals per date', async () => {
      const result = await app
        .post('/v1/reports/fiji-ncd-primary-screening-pending-referrals-line-list')
        .send({});

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(4);

      // Patient 2 - Breast Cancer Referral
      // NOTE: Have to find row like this because the report can return records in random order.
      const row1 = result.body.find(
        r => r[0] === expectedPatient2.firstName && r[8].includes('FijBCRef04-on-2021-03-13'),
      );
      expect(row1[0]).toBe(expectedPatient2.firstName);
      expect(row1[1]).toBe(expectedPatient2.lastName);
      expect(row1[2]).toBe(expectedPatient2.displayId);
      expect(row1[4]).toBe(expectedPatient2.sex);
      expect(row1[5]).toBe(ethnicity2.name);
      expect(row1[6]).toBe(patientAdditionalData2.primaryContactNumber);
      expect(row1[7]).toBe('Breast Cancer Primary Screening Referral');
      expect(row1[8]).toBe(
        `pde-FijBCRef04-on-2021-03-13T02:00:00.133Z-${expectedPatient2.firstName}`,
      );
      expect(row1[9]).toBe(
        `pde-FijBCRef07-on-2021-03-13T02:00:00.133Z-${expectedPatient2.firstName}`,
      );
      expect(row1[10]).toBe(
        `pde-FijBCRef10-on-2021-03-13T02:00:00.133Z-${expectedPatient2.firstName}`,
      );
      expect(row1[11]).toBe(
        `pde-FijBS02-on-2021-03-13T01:00:00.133Z-${expectedPatient2.firstName}`,
      );
      expect(row1[12]).toBe(
        `pde-FijBS04-on-2021-03-13T01:00:00.133Z-${expectedPatient2.firstName}`,
      );
      expect(row1[13]).toBe(
        `pde-FijBS07-on-2021-03-13T01:00:00.133Z-${expectedPatient2.firstName}`,
      );
      expect(row1[14]).toBe(
        `pde-FijBS10-on-2021-03-13T01:00:00.133Z-${expectedPatient2.firstName}`,
      );
      expect(row1[15]).toBe(null);

      // Patient 1 - Breast Cancer Referral
      const row2 = result.body.find(
        r => r[0] === expectedPatient1.firstName && r[8].includes('FijBCRef04-on-2021-03-12'),
      );
      expect(row2[0]).toBe(expectedPatient1.firstName);
      expect(row2[1]).toBe(expectedPatient1.lastName);
      expect(row2[2]).toBe(expectedPatient1.displayId);
      expect(row2[4]).toBe(expectedPatient1.sex);
      expect(row2[5]).toBe(ethnicity1.name);
      expect(row2[6]).toBe(patientAdditionalData1.primaryContactNumber);
      expect(row2[7]).toBe('Breast Cancer Primary Screening Referral');
      expect(row2[8]).toBe(
        `pde-FijBCRef04-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row2[9]).toBe(
        `pde-FijBCRef07-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row2[10]).toBe(
        `pde-FijBCRef10-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row2[11]).toBe(
        `pde-FijBS02-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row2[12]).toBe(
        `pde-FijBS04-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row2[13]).toBe(
        `pde-FijBS07-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row2[14]).toBe(
        `pde-FijBS10-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row2[15]).toBe(null);

      // Patient 1 - CVD Referral
      const row3 = result.body.find(
        r => r[0] === expectedPatient1.firstName && r[8].includes('FijCVDRef4-on-2021-03-12'),
      );
      expect(row3[0]).toBe(expectedPatient1.firstName);
      expect(row3[1]).toBe(expectedPatient1.lastName);
      expect(row3[2]).toBe(expectedPatient1.displayId);
      expect(row3[4]).toBe(expectedPatient1.sex);
      expect(row3[5]).toBe(ethnicity1.name);
      expect(row3[6]).toBe(patientAdditionalData1.primaryContactNumber);
      expect(row3[7]).toBe('CVD Primary Screening Referral');
      expect(row3[8]).toBe(
        `pde-FijCVDRef4-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row3[9]).toBe(
        `pde-FijCVDRef7-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row3[10]).toBe(
        `pde-FijCVDRef11-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row3[11]).toBe(
        `pde-FijCVD002-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row3[12]).toBe(
        `pde-FijCVD004-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row3[13]).toBe(
        `pde-FijCVD007-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row3[14]).toBe(
        `pde-FijCVD010-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row3[15]).toBe(
        `pde-FijCVDRisk334-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
      );
    });
  });
});
