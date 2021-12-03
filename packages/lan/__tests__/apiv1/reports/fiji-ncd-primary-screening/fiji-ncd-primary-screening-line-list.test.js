import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
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
  'screeningCompleted',
  'dateOfScreening',
  'screeningLocation',
  'screeningHealthFacility',
  'nameOfCso',
  'screeningEligibility',
  'cvdRiskLevel',
  'referralCreated',
  'dateOfReferral',
  'referredToHealthFacility',
  'expectedAttendanceDate',
  'referralStatus',
];
const PROPERTY_TO_EXCEL_INDEX = PROPERTY_LIST.reduce((acc, prop, i) => ({ ...acc, [prop]: i }), {});

const getProperty = (row, prop) => {
  // console.log(
  //   row,
  //   prop,
  //   PROPERTY_TO_EXCEL_INDEX,
  //   PROPERTY_TO_EXCEL_INDEX[prop],
  //   row[PROPERTY_TO_EXCEL_INDEX[prop]],
  // );
  return row[PROPERTY_TO_EXCEL_INDEX[prop]];
};
describe('Fiji NCD Primary Screening line list', () => {
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

    await createCVDFormSurveyResponse(app, expectedPatient1, '2021-03-12T01:00:00.133Z');
    await createCVDReferral(app, expectedPatient1, '2021-03-12T02:00:00.133Z');

    await createBreastCancerFormSurveyResponse(app, expectedPatient1, '2021-03-12T01:00:00.133Z');
    await createBreastCancerReferral(app, expectedPatient1, '2021-03-12T02:00:00.133Z');

    // Submit another Breast Cancer form and referral on the same date,
    // should pick the latest one per date when generating report
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, '2021-03-12T03:00:00.133Z');
    await createBreastCancerReferral(app, expectedPatient1, '2021-03-12T04:00:00.133Z');

    // No referral submitted for this
    await createBreastCancerFormSurveyResponse(app, expectedPatient2, '2021-03-14T01:00:00.133Z');
  });

  describe('checks permissions', () => {
    it('should reject creating a report request with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post(`/v1/reports/fiji-ncd-primary-screening-line-list`, {});
      expect(result).toBeForbidden();
    });
  });

  describe('returns the correct data', () => {
    it('should generate a row for each form submission and pull referral details if it was created on the same date', async () => {
      const result = await app.post('/v1/reports/fiji-ncd-primary-screening-line-list').send({});

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(4);

      /*******PATIENT 1*********/
      // Patient 1 on 2021-03-12 with 2 Breast Cancer form submissions and 2 referrals on the same date
      // Should take the latest results
      // NOTE: Have to find row like this because the report can return records in random order.
      const row1 = result.body.find(
        r => r[0] === expectedPatient1.firstName && r[8].includes('FijBS02-on-2021-03-12'),
      );
      const expectedDetails1 = {
        firstName: expectedPatient1.firstName,
        lastName: expectedPatient1.lastName,
        displayId: expectedPatient1.displayId,
        // age: ,
        gender: expectedPatient1.sex,
        ethnicity: ethnicity1.name,
        contactNumber: patientAdditionalData1.primaryContactNumber,
        screeningCompleted: 'Breast Cancer Primary Screening',
        dateOfScreening: `pde-FijBS02-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
        screeningLocation: `pde-FijBS04-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
        screeningHealthFacility: `pde-FijBS07-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
        nameOfCso: `pde-FijBS10-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
        screeningEligibility: `pde-FijBS14-on-2021-03-12T03:00:00.133Z-${expectedPatient1.firstName}`,
        cvdRiskLevel: null,
        referralCreated: `Yes`,
        dateOfReferral: `pde-FijBCRef04-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        referredToHealthFacility: `pde-FijBCRef06-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        expectedAttendanceDate: `pde-FijBCRef07-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        referralStatus: 'Pending',
      };
      for (const entry of Object.entries(expectedDetails1)) {
        const [key, expectedValue] = entry;
        expect(getProperty(row1, key)).toBe(expectedValue);
      }

      // Patient 1 on 2021-03-12 with single CVD submission and single referral on the same date
      const row2 = result.body.find(
        r => r[0] === expectedPatient1.firstName && r[8].includes('FijCVD002-on-2021-03-12'),
      );
      const expectedDetails2 = {
        firstName: expectedPatient1.firstName,
        lastName: expectedPatient1.lastName,
        displayId: expectedPatient1.displayId,
        // age: ,
        gender: expectedPatient1.sex,
        ethnicity: ethnicity1.name,
        contactNumber: patientAdditionalData1.primaryContactNumber,
        screeningCompleted: 'CVD Primary Screening',
        dateOfScreening: `pde-FijCVD002-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
        screeningLocation: `pde-FijCVD004-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
        screeningHealthFacility: `pde-FijCVD007-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
        nameOfCso: `pde-FijCVD010-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
        screeningEligibility: `pde-FijCVD021-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
        cvdRiskLevel: `pde-FijCVDRisk334-on-2021-03-12T01:00:00.133Z-${expectedPatient1.firstName}`,
        referralCreated: 'Yes',
        dateOfReferral: `pde-FijBCRef04-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        referredToHealthFacility: `pde-FijBCRef06-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        expectedAttendanceDate: `pde-FijBCRef07-on-2021-03-12T04:00:00.133Z-${expectedPatient1.firstName}`,
        referralStatus: 'Pending',
      };
      test.each(
        Object.entries(expectedDetails1),
        'Checks that property %p is valid',
        (key, expectedValue) => {
          // const [key, expectedValue] = entry;
          expect(getProperty(row2, key)).toBe(expectedValue);
        },
      );

      expect(row2[15]).toBe(
        `pde-FijCVDRef4-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row2[16]).toBe(
        `pde-FijCVDRef6-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
      );
      expect(row2[17]).toBe(
        `pde-FijCVDRef7-on-2021-03-12T02:00:00.133Z-${expectedPatient1.firstName}`,
      );

      /*******PATIENT 2*********/
      // Patient 2 on 2021-03-14 with Breast Cancer form submission but not referral on the same date
      const row3 = result.body.find(
        r => r[0] === expectedPatient2.firstName && r[8].includes('FijBS02-on-2021-03-14'),
      );
      expect(row3[0]).toBe(expectedPatient2.firstName);
      expect(row3[1]).toBe(expectedPatient2.lastName);
      expect(row3[2]).toBe(expectedPatient2.displayId);
      expect(row3[4]).toBe(expectedPatient2.sex);
      expect(row3[5]).toBe(ethnicity2.name);
      expect(row3[6]).toBe(patientAdditionalData2.primaryContactNumber);
      expect(row3[7]).toBe('Breast Cancer Primary Screening');
      expect(row3[8]).toBe(`pde-FijBS02-on-2021-03-14T01:00:00.133Z-${expectedPatient2.firstName}`);
      expect(row3[9]).toBe(`pde-FijBS04-on-2021-03-14T01:00:00.133Z-${expectedPatient2.firstName}`);
      expect(row3[10]).toBe(
        `pde-FijBS07-on-2021-03-14T01:00:00.133Z-${expectedPatient2.firstName}`,
      );
      expect(row3[11]).toBe(
        `pde-FijBS10-on-2021-03-14T01:00:00.133Z-${expectedPatient2.firstName}`,
      );
      expect(row3[12]).toBe(
        `pde-FijBS14-on-2021-03-14T01:00:00.133Z-${expectedPatient2.firstName}`,
      );
      expect(row3[13]).toBe(null);

      // Referral details, should be No/Null because no referral
      // was submitted on the same date of form submission
      expect(row3[14]).toBe(`No`);
      expect(row3[15]).toBe(null);
      expect(row3[16]).toBe(null);
      expect(row3[17]).toBe(null);
    });
  });
});
