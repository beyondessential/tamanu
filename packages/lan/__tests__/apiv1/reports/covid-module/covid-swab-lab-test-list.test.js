import moment from 'moment';
import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceIds,
} from 'shared/demoData/patients';
import { randomLabRequest } from 'shared/demoData';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { createTestContext } from '../../../utilities';

const PROGRAM_ID = 'program-fijicovid19';
const FIJI_SAMP_SURVEY_ID = 'program-fijicovid19-fijicovidsampcollection';

const PROPERTY_LIST = [
  'firstName',
  'lastName',
  'dob',
  'sex',
  'patientId',
  'homeSubDivision',
  'labRequestId',
  'labRequestType',
  'labTestType',
  'labTestMethod',
  'status',
  'result',
  'requestedBy',
  'requestedDate',
  'submittedDate',
  'priority',
  'testingLaboratory',
  'testingDate',
  'publicHealthFacility',
  'privateHealthFacility',
  'subDivision',
  'ethnicity',
  'contactPhone',
  'residentialAddress',
  'purposeOfSample',
  'recentAdmission',
  'placeOfAdmission',
  'medicalProblems',
  'healthcareWorker',
  'occupation',
  'placeOfWork',
  'linkToCluster',
  'nameOfCluster',
  'pregnant',
  'experiencingSymptoms',
  'dateOfFirstSymptom',
  'symptoms',
  'vaccinated',
  'dateOf1stDose',
  'dateOf2ndDose',
  'highRisk',
  'primaryContactHighRisk',
  'highRiskDetails',
];
const PROPERTY_TO_EXCEL_INDEX = PROPERTY_LIST.reduce((acc, prop, i) => ({ ...acc, [prop]: i }), {});

const getProperty = (result, row, prop) => result.body[row][PROPERTY_TO_EXCEL_INDEX[prop]];

const createLabTests = async (models, app, expectedPatient1, expectedPatient2) => {
  await models.ReferenceData.create({
    type: 'labTestCategory',
    id: 'labTestCategory-COVID',
    code: 'COVID-19',
    name: 'COVID-19',
  });
  await models.ReferenceData.create({
    type: 'labTestMethod',
    id: 'labTestMethod-SWAB',
    code: 'METHOD-SWAB',
    name: 'Swab',
  });

  const encounter1 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient1.id }),
  );
  const labRequest1Data = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient1.id,
    requestedDate: '2021-03-10 10:50:28',
    displayId: 'labRequest1',
    encounterId: encounter1.id,
  });
  const labRequest1 = await models.LabRequest.create(labRequest1Data);
  await models.LabTest.create({
    labTestTypeId: labRequest1Data.labTestTypeIds[0],
    labRequestId: labRequest1.id,
    date: '2021-03-10 10:50:28',
    labTestMethodId: 'labTestMethod-SWAB',
  });

  const encounter2 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient1.id }),
  );
  const labRequest2Data = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient1.id,
    requestedDate: '2021-03-16 10:50:28',
    displayId: 'labRequest2',
    encounterId: encounter2.id,
  });
  const labRequest2 = await models.LabRequest.create(labRequest2Data);
  await models.LabTest.create({
    labTestTypeId: labRequest2Data.labTestTypeIds[0],
    labRequestId: labRequest2.id,
    date: '2021-03-16 10:50:28',
  });

  const encounter3 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );
  const labRequest3Data = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient2.id,
    requestedDate: '2021-03-17 10:50:28',
    displayId: 'labRequest3',
    encounterId: encounter3.id,
  });
  const labRequest3 = await models.LabRequest.create(labRequest3Data);
  await models.LabTest.create({
    labTestTypeId: labRequest3Data.labTestTypeIds[0],
    labRequestId: labRequest3.id,
    date: '2021-03-17 10:50:28',
  });

  const encounter4 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );
  const labRequest4Data = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient2.id,
    requestedDate: '2021-03-20 10:50:28',
    displayId: 'labRequest4',
    encounterId: encounter4.id,
  });
  const labRequest4 = await models.LabRequest.create(labRequest4Data);
  await models.LabTest.create({
    labTestTypeId: labRequest4Data.labTestTypeIds[0],
    labRequestId: labRequest4.id,
    date: '2021-03-20 10:50:28',
  });

  // SHOULD NOT DISPLAY - Due to it's DELETED status
  const encounter5 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );
  const labRequest5Data = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient2.id,
    requestedDate: '2021-03-20 10:50:28',
    displayId: 'labRequest4',
    encounterId: encounter5.id,
    status: LAB_REQUEST_STATUSES.DELETED,
  });
  const labRequest5 = await models.LabRequest.create(labRequest5Data);
  await models.LabTest.create({
    labTestTypeId: labRequest5Data.labTestTypeIds[0],
    labRequestId: labRequest5.id,
    date: '2021-03-20 10:50:28',
  });

  // SHOULD NOT DISPLAY - Due to it's CANCELLED status
  const encounter5A = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );

  const labRequest5AData = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient2.id,
    requestedDate: '2021-03-20 10:50:28',
    displayId: 'labRequest5A',
    encounterId: encounter5A.id,
    status: LAB_REQUEST_STATUSES.CANCELLED,
  });
  const labRequest5A = await models.LabRequest.create(labRequest5AData);
  await models.LabTest.create({
    labTestTypeId: labRequest5Data.labTestTypeIds[0],
    labRequestId: labRequest5A.id,
    date: '2021-03-20 10:50:28',
  });

  // SHOULD NOT DISPLAY - Due to it's ENTERED IN ERROR status
  const encounter5B = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );

  const labRequest5BData = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient2.id,
    requestedDate: '2021-03-20 10:50:28',
    displayId: 'labRequest5B',
    encounterId: encounter5B.id,
    status: LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
  });
  const labRequest5B = await models.LabRequest.create(labRequest5BData);
  await models.LabTest.create({
    labTestTypeId: labRequest5Data.labTestTypeIds[0],
    labRequestId: labRequest5B.id,
    date: '2021-03-20 10:50:28',
  });

  // SHOULD NOT DISPLAY - Due to it's patient_id being William Horoto's
  const williamHoroto = await models.Patient.create({
    firstName: 'William',
    lastName: 'Horoto',
    dateOfBirth: new Date(2000, 1, 1),
    sex: 'male',
    displayId: 'WILLIAM',
    id: 'cebdd9a4-2744-4ad2-9919-98dc0b15464c',
  });
  const encounter6 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: williamHoroto.id }),
  );
  const labRequest6Data = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: williamHoroto.id,
    requestedDate: '2021-03-20 10:50:28',
    displayId: 'labRequest4',
    encounterId: encounter6.id,
    status: LAB_REQUEST_STATUSES.DELETED,
  });
  const labRequest6 = await models.LabRequest.create(labRequest6Data);
  await models.LabTest.create({
    labTestTypeId: labRequest6Data.labTestTypeIds[0],
    labRequestId: labRequest6.id,
    date: '2021-03-20 10:50:28',
  });

  return [labRequest1, labRequest2, labRequest3, labRequest4];
};

const createSurveys = async (models, app, expectedPatient1, expectedPatient2) => {
  await models.Program.create({
    id: PROGRAM_ID,
    name: 'Fiji COVID-19',
  });

  await models.ProgramDataElement.bulkCreate([
    { id: 'pde-FijCOVSamp4', code: 'IrqMAReg-13', name: 'pde-IrqMAReg-13', type: 'FreeText' },
    { id: 'pde-FijCOVSamp6', code: 'FijCOVSamp6', name: 'pde-FijCOVSamp6', type: 'FreeText' },
    { id: 'pde-FijCOVSamp7', code: 'FijCOVSamp7', name: 'pde-FijCOVSamp7', type: 'FreeText' },
    { id: 'pde-FijCOVSamp10', code: 'FijCOVSamp10', name: 'pde-FijCOVSamp10', type: 'FreeText' },
    { id: 'pde-FijCOVSamp11', code: 'FijCOVSamp11', name: 'pde-FijCOVSamp11', type: 'FreeText' },
    { id: 'pde-FijCOVSamp12', code: 'FijCOVSamp12', name: 'pde-FijCOVSamp12', type: 'FreeText' },
    { id: 'pde-FijCOVSamp13', code: 'FijCOVSamp13', name: 'pde-FijCOVSamp13', type: 'FreeText' },
  ]);

  await models.Survey.create({
    id: FIJI_SAMP_SURVEY_ID,
    name: 'Fiji covid sample collection',
    programId: PROGRAM_ID,
  });

  await models.SurveyScreenComponent.bulkCreate([
    { dataElementId: 'pde-FijCOVSamp4', surveyId: FIJI_SAMP_SURVEY_ID },
    { dataElementId: 'pde-FijCOVSamp6', surveyId: FIJI_SAMP_SURVEY_ID },
    { dataElementId: 'pde-FijCOVSamp7', surveyId: FIJI_SAMP_SURVEY_ID },
    { dataElementId: 'pde-FijCOVSamp10', surveyId: FIJI_SAMP_SURVEY_ID },
    { dataElementId: 'pde-FijCOVSamp11', surveyId: FIJI_SAMP_SURVEY_ID },
    { dataElementId: 'pde-FijCOVSamp12', surveyId: FIJI_SAMP_SURVEY_ID },
    { dataElementId: 'pde-FijCOVSamp13', surveyId: FIJI_SAMP_SURVEY_ID },
  ]);

  const encounter1 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient1.id }),
  );
  const encounter2 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient1.id }),
  );
  const encounter3 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient1.id }),
  );
  const encounter4 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient1.id }),
  );

  const encounter5 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );
  const encounter6 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );
  const encounter7 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );
  const encounter8 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );

  // ----Submit answers for patient 1----
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-11 10:50:28',
    patientId: expectedPatient1.id,
    endTime: '2021-03-11 10:53:15',
    encounterId: encounter1.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-13 10:53:15-Patient1',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-13 10:53:15-Patient1',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-13 10:53:15-Patient1',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-13 10:53:15-Patient1',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-13 10:53:15-Patient1',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-14 10:50:28',
    patientId: expectedPatient1.id,
    endTime: '2021-03-14 10:53:15',
    encounterId: encounter2.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-14 10:53:15-Patient1',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-14 10:53:15-Patient1',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-14 10:53:15-Patient1',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-14 10:53:15-Patient1',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-14 10:53:15-Patient1',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-16 10:50:28',
    patientId: expectedPatient1.id,
    endTime: '2021-03-16 10:53:15',
    encounterId: encounter3.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-16 10:53:15-Patient1',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-16 10:53:15-Patient1',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-16 10:53:15-Patient1',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-16 10:53:15-Patient1',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-16 10:53:15-Patient1',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-18 10:50:28',
    patientId: expectedPatient1.id,
    endTime: '2021-03-18 10:53:15',
    encounterId: encounter4.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-18 10:53:15-Patient1',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-18 10:53:15-Patient1',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-18 10:53:15-Patient1',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-18 10:53:15-Patient1',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-18 10:53:15-Patient1',
    },
  });

  // ----Submit answers for patient 2----
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-18 10:50:28',
    patientId: expectedPatient2.id,
    endTime: '2021-03-18 10:53:15',
    encounterId: encounter5.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-18 10:53:15-Patient2',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-18 10:53:15-Patient2',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-18 10:53:15-Patient2',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-18 10:53:15-Patient2',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-18 10:53:15-Patient2',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-19 10:50:28',
    patientId: expectedPatient2.id,
    endTime: '2021-03-19 10:53:15',
    encounterId: encounter6.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-19 10:53:15-Patient2',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-19 10:53:15-Patient2',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-19 10:53:15-Patient2',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-19 10:53:15-Patient2',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-19 10:53:15-Patient2',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-21 10:50:28',
    patientId: expectedPatient2.id,
    endTime: '2021-03-21 10:53:15',
    encounterId: encounter7.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-21 10:53:15-Patient2',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-21 10:53:15-Patient2',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-21 10:53:15-Patient2',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-21 10:53:15-Patient2',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-21 10:53:15-Patient2',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-23 10:50:28',
    patientId: expectedPatient2.id,
    endTime: '2021-03-23 10:53:15',
    encounterId: encounter8.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-23 10:53:15-Patient2',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-23 10:53:15-Patient2',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-23 10:53:15-Patient2',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-23 10:53:15-Patient2',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-23 10:53:15-Patient2',
    },
  });
};

describe('Covid swab lab test list', () => {
  let baseApp = null;
  let app = null;
  let expectedPatient1 = null;
  let expectedPatient2 = null;
  let village1 = null;
  let village2 = null;
  let labRequest1 = null;
  let labRequest2 = null;
  let labRequest3 = null;
  let labRequest4 = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    const { models } = ctx;
    baseApp = ctx.baseApp;
    [village1, village2] = await randomReferenceIds(models, 'village', 2);

    expectedPatient1 = await models.Patient.create(
      await createDummyPatient(models, { villageId: village1 }),
    );
    expectedPatient2 = await models.Patient.create(
      await createDummyPatient(models, { villageId: village2 }),
    );

    app = await baseApp.asRole('practitioner');

    await createSurveys(models, app, expectedPatient1, expectedPatient2);
    [labRequest1, labRequest2, labRequest3, labRequest4] = await createLabTests(
      models,
      app,
      expectedPatient1,
      expectedPatient2,
    );
  });
  afterAll(() => ctx.close());

  describe('checks permissions', () => {
    it('should reject creating a report with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post(`/v1/reports/fiji-covid-swab-lab-test-list`, {});
      expect(result).toBeForbidden();
    });
  });

  describe('returns the correct data', () => {
    it('with a village parameter', async () => {
      const PATIENT_ID_COLUMN = 4;
      const result = await app.post('/v1/reports/fiji-covid-swab-lab-test-list').send({
        parameters: {
          village: village1,
          fromDate: '2021-03-01',
        },
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(3);
      expect(result.body.map(r => r[PATIENT_ID_COLUMN])).toEqual([
        'Patient ID',
        expectedPatient1.displayId,
        expectedPatient1.displayId,
      ]);
    });
    it('should return latest data per patient and latest data per patient per date', async () => {
      const result = await app.post('/v1/reports/fiji-covid-swab-lab-test-list').send({
        parameters: {
          fromDate: '2021-03-01',
        },
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(5);

      /** *****Lab request 1******** */
      // patient details
      const expectedDetails1 = {
        firstName: expectedPatient1.firstName,
        lastName: expectedPatient1.lastName,
        dob: moment(expectedPatient1.dateOfBirth).format('YYYY/MM/DD'),
        sex: expectedPatient1.sex,
        patientId: expectedPatient1.displayId,
        labRequestId: labRequest1.displayId,
        // Fiji Samp collection form
        // always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
        labRequestType: 'COVID-19',
        labTestMethod: 'Swab',
        status: 'Reception pending',
        requestedDate: '2021/03/10',
        submittedDate: '2021/03/10',
        publicHealthFacility: 'pde-FijCOVSamp4-on-2021-03-14 10:53:15-Patient1',
        subDivision: 'pde-FijCOVSamp7-on-2021-03-14 10:53:15-Patient1',
        ethnicity: 'pde-FijCOVSamp10-on-2021-03-14 10:53:15-Patient1',
        contactPhone: 'pde-FijCOVSamp11-on-2021-03-14 10:53:15-Patient1',
      };
      for (const entry of Object.entries(expectedDetails1)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 1, key)).toBe(expectedValue);
      }

      /** *****Lab request 2******** */
      // patient details
      const expectedDetails2 = {
        firstName: expectedPatient1.firstName,
        lastName: expectedPatient1.lastName,
        dob: moment(expectedPatient1.dateOfBirth).format('YYYY/MM/DD'),
        sex: expectedPatient1.sex,
        patientId: expectedPatient1.displayId,
        labRequestId: labRequest2.displayId,
        // Fiji Samp collection form
        // always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
        labRequestType: 'COVID-19',
        status: 'Reception pending',
        requestedDate: '2021/03/16',
        submittedDate: '2021/03/16',
        publicHealthFacility: 'pde-FijCOVSamp4-on-2021-03-18 10:53:15-Patient1',
        subDivision: 'pde-FijCOVSamp7-on-2021-03-18 10:53:15-Patient1',
        ethnicity: 'pde-FijCOVSamp10-on-2021-03-18 10:53:15-Patient1',
        contactPhone: 'pde-FijCOVSamp11-on-2021-03-18 10:53:15-Patient1',
      };
      for (const entry of Object.entries(expectedDetails2)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 2, key)).toBe(expectedValue);
      }

      /** *****Lab request 3******** */
      // patient details
      const expectedDetails3 = {
        firstName: expectedPatient2.firstName,
        lastName: expectedPatient2.lastName,
        dob: moment(expectedPatient2.dateOfBirth).format('YYYY/MM/DD'),
        sex: expectedPatient2.sex,
        patientId: expectedPatient2.displayId,
        labRequestId: labRequest3.displayId,
        // Fiji Samp collection form
        // always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
        labRequestType: 'COVID-19',
        status: 'Reception pending',
        requestedDate: '2021/03/17',
        submittedDate: '2021/03/17',
        publicHealthFacility: 'pde-FijCOVSamp4-on-2021-03-19 10:53:15-Patient2',
        subDivision: 'pde-FijCOVSamp7-on-2021-03-19 10:53:15-Patient2',
        ethnicity: 'pde-FijCOVSamp10-on-2021-03-19 10:53:15-Patient2',
        contactPhone: 'pde-FijCOVSamp11-on-2021-03-19 10:53:15-Patient2',
      };
      for (const entry of Object.entries(expectedDetails3)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 3, key)).toBe(expectedValue);
      }

      /** *****Lab request 4******** */
      const expectedDetails4 = {
        firstName: expectedPatient2.firstName,
        lastName: expectedPatient2.lastName,
        dob: moment(expectedPatient2.dateOfBirth).format('YYYY/MM/DD'),
        sex: expectedPatient2.sex,
        patientId: expectedPatient2.displayId,
        labRequestId: labRequest4.displayId,
        // Fiji Samp collection form
        // always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
        labRequestType: 'COVID-19',
        status: 'Reception pending',
        requestedDate: '2021/03/20',
        submittedDate: '2021/03/20',
        publicHealthFacility: 'pde-FijCOVSamp4-on-2021-03-23 10:53:15-Patient2',
        subDivision: 'pde-FijCOVSamp7-on-2021-03-23 10:53:15-Patient2',
        ethnicity: 'pde-FijCOVSamp10-on-2021-03-23 10:53:15-Patient2',
        contactPhone: 'pde-FijCOVSamp11-on-2021-03-23 10:53:15-Patient2',
      };
      for (const entry of Object.entries(expectedDetails4)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 4, key)).toBe(expectedValue);
      }
    });
  });
});
