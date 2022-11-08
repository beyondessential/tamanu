import { createDummyPatient, randomReferenceDataObjects } from 'shared/demoData/patients';
import { REFERRAL_STATUSES, REFERENCE_TYPES } from 'shared/constants';
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
  'subdivision', // Internally: village
  'medicalArea',
  'nursingZone',
  'screeningCompleted',
  'dateOfScreening',
  'screeningLocation',
  'screeningHealthFacility',
  'nameOfCso',
  'screeningEligibility',
  'cvdRiskLevel',
  'breastCancerRiskLevel',
  'referralCreated',
  'dateOfReferral',
  'referredToHealthFacility',
  'expectedAttendanceDate',
  'referralStatus',
];
const PROPERTY_TO_EXCEL_INDEX = PROPERTY_LIST.reduce((acc, prop, i) => ({ ...acc, [prop]: i }), {});

const getProperty = (row, prop) => row[PROPERTY_TO_EXCEL_INDEX[prop]];

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
  const subdivision = null;
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
      id: `ethnicity-abc-${new Date().toString()}`,
      name: 'abc',
      code: 'abc',
      type: REFERENCE_TYPES.ETHNICITY,
    });
    ethnicity2 = await models.ReferenceData.create({
      id: `ethnicity-def-${new Date().toString()}`,
      name: 'def',
      code: 'def',
      type: REFERENCE_TYPES.ETHNICITY,
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

    await createCVDFormSurveyResponse(app, expectedPatient1, '2021-03-12 01:00:00');
    await createCVDReferral(app, expectedPatient1, '2021-03-12 02:00:00');

    await createBreastCancerFormSurveyResponse(app, expectedPatient1, '2021-03-12 01:00:00');
    await createBreastCancerReferral(app, expectedPatient1, '2021-03-12 02:00:00');

    // Submit another Breast Cancer form and referral on the same date,
    // should pick the latest one per date when generating report
    await createBreastCancerFormSurveyResponse(app, expectedPatient1, '2021-03-12 03:00:00');
    await createBreastCancerReferral(app, expectedPatient1, '2021-03-12 04:00:00');

    const mostRecentBreastCancerReferral = await models.Referral.findOne({
      include: [
        {
          model: models.Encounter,
          as: 'initiatingEncounter',
          where: { patientId: expectedPatient1.id },
        },
        {
          model: models.SurveyResponse,
          as: 'surveyResponse',
          where: { endTime: '2021-03-12 04:00:00' },
        },
      ],
    });
    await models.Referral.update(
      { status: REFERRAL_STATUSES.COMPLETED },
      { where: { id: mostRecentBreastCancerReferral.id } },
    );

    // No referral submitted for this
    await createBreastCancerFormSurveyResponse(app, expectedPatient2, '2021-03-14 01:00:00', {
      resultText: undefined,
    });
  });
  afterAll(() => ctx.close());

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
        r =>
          getProperty(r, 'firstName') === expectedPatient1.firstName &&
          getProperty(r, 'dateOfScreening').includes('FijBS02-on-2021-03-12'),
      );
      const expectedDetails1 = {
        firstName: expectedPatient1.firstName,
        lastName: expectedPatient1.lastName,
        displayId: expectedPatient1.displayId,
        // age: ,
        gender: expectedPatient1.sex,
        ethnicity: ethnicity1.name,
        subdivision: village1.name,
        medicalArea: medicalArea.name,
        nursingZone: nursingZone.name,
        contactNumber: patientAdditionalData1.primaryContactNumber,
        screeningCompleted: 'Breast Cancer Primary Screening',
        dateOfScreening: `pde-FijBS02-on-2021-03-12 03:00:00-${expectedPatient1.firstName}`,
        screeningLocation: `pde-FijBS04-on-2021-03-12 03:00:00-${expectedPatient1.firstName}`,
        screeningHealthFacility: `pde-FijBS07-on-2021-03-12 03:00:00-${expectedPatient1.firstName}`,
        nameOfCso: `pde-FijBS10-on-2021-03-12 03:00:00-${expectedPatient1.firstName}`,
        screeningEligibility: `pde-FijBS14-on-2021-03-12 03:00:00-${expectedPatient1.firstName}`,
        cvdRiskLevel: null,
        breastCancerRiskLevel: 'High risk',
        referralCreated: `Yes`,
        dateOfReferral: `pde-FijBCRef04-on-2021-03-12 04:00:00-${expectedPatient1.firstName}`,
        referredToHealthFacility: `pde-FijBCRef06-on-2021-03-12 04:00:00-${expectedPatient1.firstName}`,
        expectedAttendanceDate: `pde-FijBCRef07-on-2021-03-12 04:00:00-${expectedPatient1.firstName}`,
        referralStatus: 'Completed',
      };
      for (const entry of Object.entries(expectedDetails1)) {
        const [key, expectedValue] = entry;
        expect(getProperty(row1, key)).toBe(expectedValue);
      }

      // Patient 1 on 2021-03-12 with single CVD submission and single referral on the same date
      const row2 = result.body.find(
        r =>
          getProperty(r, 'firstName') === expectedPatient1.firstName &&
          getProperty(r, 'dateOfScreening').includes('FijCVD002-on-2021-03-12'),
      );
      const expectedDetails2 = {
        firstName: expectedPatient1.firstName,
        lastName: expectedPatient1.lastName,
        displayId: expectedPatient1.displayId,
        // age: ,
        gender: expectedPatient1.sex,
        ethnicity: ethnicity1.name,
        subdivision: village1.name,
        medicalArea: medicalArea.name,
        nursingZone: nursingZone.name,
        contactNumber: patientAdditionalData1.primaryContactNumber,
        screeningCompleted: 'CVD Primary Screening',
        dateOfScreening: `pde-FijCVD002-on-2021-03-12 01:00:00-${expectedPatient1.firstName}`,
        screeningLocation: `pde-FijCVD004-on-2021-03-12 01:00:00-${expectedPatient1.firstName}`,
        screeningHealthFacility: `pde-FijCVD007-on-2021-03-12 01:00:00-${expectedPatient1.firstName}`,
        nameOfCso: `pde-FijCVD010-on-2021-03-12 01:00:00-${expectedPatient1.firstName}`,
        screeningEligibility: `pde-FijCVD021-on-2021-03-12 01:00:00-${expectedPatient1.firstName}`,
        cvdRiskLevel: '3% GREEN',
        breastCancerRiskLevel: null,
        referralCreated: 'Yes',
        dateOfReferral: `pde-FijCVDRef4-on-2021-03-12 02:00:00-${expectedPatient1.firstName}`,
        referredToHealthFacility: `pde-FijCVDRef6-on-2021-03-12 02:00:00-${expectedPatient1.firstName}`,
        expectedAttendanceDate: `pde-FijCVDRef7-on-2021-03-12 02:00:00-${expectedPatient1.firstName}`,
        referralStatus: 'Pending',
      };
      for (const entry of Object.entries(expectedDetails2)) {
        const [key, expectedValue] = entry;
        expect(getProperty(row2, key)).toBe(expectedValue);
      }

      /*******PATIENT 2*********/
      // Patient 2 on 2021-03-14 with Breast Cancer form submission but not referral on the same date
      const row3 = result.body.find(
        r =>
          getProperty(r, 'firstName') === expectedPatient2.firstName &&
          getProperty(r, 'dateOfScreening').includes('FijBS02-on-2021-03-14'),
      );
      const expectedDetails3 = {
        firstName: expectedPatient2.firstName,
        lastName: expectedPatient2.lastName,
        displayId: expectedPatient2.displayId,
        // age: ,
        gender: expectedPatient2.sex,
        ethnicity: ethnicity2.name,
        subdivision: village2.name,
        medicalArea: medicalArea.name,
        nursingZone: nursingZone.name,
        contactNumber: patientAdditionalData2.primaryContactNumber,
        screeningCompleted: 'Breast Cancer Primary Screening',
        dateOfScreening: `pde-FijBS02-on-2021-03-14 01:00:00-${expectedPatient2.firstName}`,
        screeningLocation: `pde-FijBS04-on-2021-03-14 01:00:00-${expectedPatient2.firstName}`,
        screeningHealthFacility: `pde-FijBS07-on-2021-03-14 01:00:00-${expectedPatient2.firstName}`,
        nameOfCso: `pde-FijBS10-on-2021-03-14 01:00:00-${expectedPatient2.firstName}`,
        screeningEligibility: `pde-FijBS14-on-2021-03-14 01:00:00-${expectedPatient2.firstName}`,
        cvdRiskLevel: null,
        breastCancerRiskLevel: 'Not high risk',
        referralCreated: 'No',
        dateOfReferral: null,
        referredToHealthFacility: null,
        expectedAttendanceDate: null,
        referralStatus: null,
      };
      for (const entry of Object.entries(expectedDetails3)) {
        const [key, expectedValue] = entry;
        expect(getProperty(row3, key)).toBe(expectedValue);
      }
    });
  });
});
