import { createDummyPatient, randomReferenceDataObjects } from '@tamanu/shared/demoData/patients';
import { REFERENCE_TYPES } from '@tamanu/constants';
import { createTestContext } from '../../../utilities';
import {
  setupProgramAndSurvey,
  createCVDFormSurveyResponse,
  createCVDReferral,
  createBreastCancerFormSurveyResponse,
  createBreastCancerReferral,
} from './utils';

const PROPERTY_LIST = [
  'firstName',
  'lastName',
  'displayId',
  'age',
  'gender',
  'ethnicity',
  'contactNumber',
  'subdivision', // internally: village
  'medicalArea',
  'nursingZone',
  'referralCreated',
  'referringHealthFacility',
  'referringCso',
  'dateOfReferral',
  'expectedAttendanceDate',
  'reasonForReferral',
  'dateOfScreening',
  'screeningLocation',
  'screeningHealthFacility',
  'nameOfCso',
  'cvdRiskLevel',
  'breastCancerRiskLevel',
];
const PROPERTY_TO_EXCEL_INDEX = PROPERTY_LIST.reduce((acc, prop, i) => ({ ...acc, [prop]: i }), {});

const getProperty = (row, prop) => row[PROPERTY_TO_EXCEL_INDEX[prop]];

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
  let medicalArea = null;
  let nursingZone = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
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

    [village1, village2] = await randomReferenceDataObjects(models, 'village', 2);

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

    medicalArea = await models.ReferenceData.create({
      id: `medicalArea-abc-${new Date().toString()}`,
      name: 'abc2',
      code: 'abc',
      type: REFERENCE_TYPES.MEDICAL_AREA,
    });
    nursingZone = await models.ReferenceData.create({
      id: `nursingZone-abc-${new Date().toString()}`,
      name: 'abc3',
      code: 'abc',
      type: REFERENCE_TYPES.NURSING_ZONE,
    });

    expectedPatient1 = await models.Patient.create(
      await createDummyPatient(models, { villageId: village1.id, sex: 'male' }),
    );
    patientAdditionalData1 = await models.PatientAdditionalData.create({
      patientId: expectedPatient1.id,
      ethnicityId: ethnicity1.id,
      primaryContactNumber: '123',
      medicalAreaId: medicalArea.id,
      nursingZoneId: nursingZone.id,
    });
    expectedPatient2 = await models.Patient.create(
      await createDummyPatient(models, { villageId: village2.id, sex: 'female' }),
    );
    patientAdditionalData2 = await models.PatientAdditionalData.create({
      patientId: expectedPatient2.id,
      ethnicityId: ethnicity2.id,
      primaryContactNumber: '456',
      medicalAreaId: medicalArea.id,
      nursingZoneId: nursingZone.id,
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
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, '2021-03-12T03:00:00.133Z', {
      resultText: undefined,
    });
    await createBreastCancerReferral(app, expectedPatient1, '2021-03-12T04:00:00.133Z');

    // Breast Cancer referral on 2021-03-13 => should generate 1 row
    await createBreastCancerFormSurveyResponse(app, expectedPatient2, '2021-03-13T01:00:00.133Z');
    await createBreastCancerReferral(app, expectedPatient2, '2021-03-13T02:00:00.133Z');

    // Form submission but no referral submitted on 2021-03-14 => should not generate any row because there's now referral
    await createBreastCancerFormSurveyResponse(app, expectedPatient2, '2021-03-14T01:00:00.133Z');
  });
  afterAll(() => ctx.close());

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
        r =>
          r[0] === expectedPatient2.firstName &&
          getProperty(r, 'dateOfReferral').includes('FijBCRef04-on-2021-03-13'),
      );
      const expectedDetails1 = {
        firstName: expectedPatient2.firstName,
        lastName: expectedPatient2.lastName,
        displayId: expectedPatient2.displayId,
        // age: ,
        gender: expectedPatient2.sex,
        ethnicity: ethnicity2.name,
        contactNumber: patientAdditionalData2.primaryContactNumber,
        subdivision: village2.name,
        medicalArea: medicalArea.name,
        nursingZone: nursingZone.name,
        referralCreated: 'Breast Cancer Primary Screening Referral',
        dateOfReferral: `pde-FijBCRef04-on-2021-03-13T02:00:00.133Z-${expectedPatient2.firstName}`,
        // referringHealthFacility: `pde-FijBCRef06-on-2021-03-13T02:00:00.133Z-${expectedPatient2.firstName}`,
        expectedAttendanceDate: `pde-FijBCRef07-on-2021-03-13T02:00:00.133Z-${expectedPatient2.firstName}`,
        nameOfCso: `pde-FijBS10-on-2021-03-13T01:00:00.133Z-${expectedPatient2.firstName}`,
        referringCso: `pde-FijBCRef2a-on-2021-03-13T02:00:00.133Z-${expectedPatient2.firstName}`,
        cvdRiskLevel: null,
        breastCancerRiskLevel: 'High risk',
        reasonForReferral: `pde-FijBCRef10-on-2021-03-13T02:00:00.133Z-${expectedPatient2.firstName}`,
        dateOfScreening: `pde-FijBS02-on-2021-03-13T01:00:00.133Z-${expectedPatient2.firstName}`,
        screeningLocation: `pde-FijBS04-on-2021-03-13T01:00:00.133Z-${expectedPatient2.firstName}`,
        screeningHealthFacility: `pde-FijBS07-on-2021-03-13T01:00:00.133Z-${expectedPatient2.firstName}`,
      };
      for (const entry of Object.entries(expectedDetails1)) {
        const [key, expectedValue] = entry;
        expect(getProperty(row1, key)).toBe(expectedValue);
      }

      // Patient 1 - Breast Cancer Referral
      const row2 = result.body.find(
        r =>
          r[0] === expectedPatient1.firstName &&
          getProperty(r, 'dateOfReferral').includes('FijBCRef04-on-2021-03-12'),
      );
      const expectedDetails2 = {
        firstName: expectedPatient1.firstName,
        lastName: expectedPatient1.lastName,
        displayId: expectedPatient1.displayId,
        // age: ,
        gender: expectedPatient1.sex,
        ethnicity: ethnicity1.name,
        contactNumber: patientAdditionalData1.primaryContactNumber,
        subdivision: village1.name,
        medicalArea: medicalArea.name,
        nursingZone: nursingZone.name,
        referralCreated: 'Breast Cancer Primary Screening Referral',
        dateOfReferral: `pde-FijBCRef04-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        // referringHealthFacility: `pde-FijBCRef06-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        expectedAttendanceDate: `pde-FijBCRef07-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        nameOfCso: `pde-FijBS10-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
        referringCso: `pde-FijBCRef2a-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        cvdRiskLevel: null,
        breastCancerRiskLevel: 'Not high risk',
        reasonForReferral: `pde-FijBCRef10-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        dateOfScreening: `pde-FijBS02-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
        screeningLocation: `pde-FijBS04-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
        screeningHealthFacility: `pde-FijBS07-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
      };
      for (const entry of Object.entries(expectedDetails2)) {
        const [key, expectedValue] = entry;
        expect(getProperty(row2, key)).toBe(expectedValue);
      }

      // Patient 1 - CVD Referral
      const row3 = result.body.find(
        r =>
          r[0] === expectedPatient1.firstName &&
          getProperty(r, 'dateOfReferral').includes('FijCVDRef4-on-2021-03-12'),
      );
      const expectedDetails3 = {
        firstName: expectedPatient1.firstName,
        lastName: expectedPatient1.lastName,
        displayId: expectedPatient1.displayId,
        // age: ,
        gender: expectedPatient1.sex,
        ethnicity: ethnicity1.name,
        contactNumber: patientAdditionalData1.primaryContactNumber,
        subdivision: village1.name,
        medicalArea: medicalArea.name,
        nursingZone: nursingZone.name,
        referralCreated: 'CVD Primary Screening Referral',
        dateOfReferral: `pde-FijCVDRef4-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
        // referringHealthFacility: `pde-FijCVDRef6-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
        expectedAttendanceDate: `pde-FijCVDRef7-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
        nameOfCso: `pde-FijCVD010-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
        referringCso: `pde-FijCVDRef2a-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
        cvdRiskLevel: '3% GREEN',
        breastCancerRiskLevel: null,
        reasonForReferral: `pde-FijCVDRef11-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
        dateOfScreening: `pde-FijCVD002-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
        screeningLocation: `pde-FijCVD004-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
        screeningHealthFacility: `pde-FijCVD007-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
      };
      for (const entry of Object.entries(expectedDetails3)) {
        const [key, expectedValue] = entry;
        expect(getProperty(row3, key)).toBe(expectedValue);
      }
    });
  });
});
