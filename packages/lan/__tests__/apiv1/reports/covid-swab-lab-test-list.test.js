import moment from 'moment';
import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceId,
} from 'shared/demoData/patients';
import { randomLabRequest } from 'shared/demoData';
import { LabTest } from 'shared/models/LabTest';
import { createTestContext } from '../../utilities';

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
  'status',
  'result',
  'requestedBy',
  'requestedDate',
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

  const encounter1 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient1.id }),
  );
  const labRequest1Data = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient1.id,
    requestedDate: '2021-03-10T10:50:28.133Z',
    displayId: 'labRequest1',
    encounterId: encounter1.id,
  });
  const labRequest1 = await models.LabRequest.create(labRequest1Data);
  await models.LabTest.create({
    labTestTypeId: labRequest1Data.labTestTypeIds[0],
    labRequestId: labRequest1.id,
    date: '2021-03-10T10:50:28.133Z',
  });

  const encounter2 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient1.id }),
  );
  const labRequest2Data = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient1.id,
    requestedDate: '2021-03-16T10:50:28.133Z',
    displayId: 'labRequest2',
    encounterId: encounter2.id,
  });
  const labRequest2 = await models.LabRequest.create(labRequest2Data);
  await models.LabTest.create({
    labTestTypeId: labRequest2Data.labTestTypeIds[0],
    labRequestId: labRequest2.id,
    date: '2021-03-16T10:50:28.133Z',
  });

  const encounter3 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );
  const labRequest3Data = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient2.id,
    requestedDate: '2021-03-17T10:50:28.133Z',
    displayId: 'labRequest3',
    encounterId: encounter3.id,
  });
  const labRequest3 = await models.LabRequest.create(labRequest3Data);
  await models.LabTest.create({
    labTestTypeId: labRequest3Data.labTestTypeIds[0],
    labRequestId: labRequest3.id,
    date: '2021-03-17T10:50:28.133Z',
  });

  const encounter4 = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: expectedPatient2.id }),
  );
  const labRequest4Data = await randomLabRequest(models, {
    labTestCategoryId: 'labTestCategory-COVID',
    patientId: expectedPatient2.id,
    requestedDate: '2021-03-20T10:50:28.133Z',
    displayId: 'labRequest4',
    encounterId: encounter4.id,
  });
  const labRequest4 = await models.LabRequest.create(labRequest4Data);
  await models.LabTest.create({
    labTestTypeId: labRequest4Data.labTestTypeIds[0],
    labRequestId: labRequest4.id,
    date: '2021-03-20T10:50:28.133Z',
  });

  return [labRequest1, labRequest2, labRequest3, labRequest4];
};

const createSurveys = async (models, app, expectedPatient1, expectedPatient2) => {
  await models.Program.create({
    id: PROGRAM_ID,
    name: 'Fiji COVID-19',
  });

  await models.ProgramDataElement.bulkCreate([
    { id: 'pde-FijCOVSamp4', code: 'IrqMAReg-13', name: 'pde-IrqMAReg-13' },
    { id: 'pde-FijCOVSamp6', code: 'FijCOVSamp6', name: 'pde-FijCOVSamp6' },
    { id: 'pde-FijCOVSamp7', code: 'FijCOVSamp7', name: 'pde-FijCOVSamp7' },
    { id: 'pde-FijCOVSamp10', code: 'FijCOVSamp10', name: 'pde-FijCOVSamp10' },
    { id: 'pde-FijCOVSamp11', code: 'FijCOVSamp11', name: 'pde-FijCOVSamp11' },
    { id: 'pde-FijCOVSamp12', code: 'FijCOVSamp12', name: 'pde-FijCOVSamp12' },
    { id: 'pde-FijCOVSamp13', code: 'FijCOVSamp13', name: 'pde-FijCOVSamp13' },
  ]);

  await models.Survey.create({
    id: FIJI_SAMP_SURVEY_ID,
    name: 'Assistive Technology Project',
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
    startTime: '2021-03-11T10:50:28.133Z',
    patientId: expectedPatient1.id,
    endTime: '2021-03-11T10:53:15.708Z',
    encounterId: encounter1.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-13T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-13T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-13T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-13T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-13T10:53:15.708Z-Patient1',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-14T10:50:28.133Z',
    patientId: expectedPatient1.id,
    endTime: '2021-03-14T10:53:15.708Z',
    encounterId: encounter2.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-14T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-14T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-14T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-14T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-14T10:53:15.708Z-Patient1',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-16T10:50:28.133Z',
    patientId: expectedPatient1.id,
    endTime: '2021-03-16T10:53:15.708Z',
    encounterId: encounter3.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-16T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-16T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-16T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-16T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-16T10:53:15.708Z-Patient1',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-18T10:50:28.133Z',
    patientId: expectedPatient1.id,
    endTime: '2021-03-18T10:53:15.708Z',
    encounterId: encounter4.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-18T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-18T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-18T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-18T10:53:15.708Z-Patient1',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-18T10:53:15.708Z-Patient1',
    },
  });

  // ----Submit answers for patient 2----
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-18T10:50:28.133Z',
    patientId: expectedPatient2.id,
    endTime: '2021-03-18T10:53:15.708Z',
    encounterId: encounter5.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-18T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-18T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-18T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-18T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-18T10:53:15.708Z-Patient2',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-19T10:50:28.133Z',
    patientId: expectedPatient2.id,
    endTime: '2021-03-19T10:53:15.708Z',
    encounterId: encounter6.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-19T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-19T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-19T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-19T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-19T10:53:15.708Z-Patient2',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-21T10:50:28.133Z',
    patientId: expectedPatient2.id,
    endTime: '2021-03-21T10:53:15.708Z',
    encounterId: encounter7.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-21T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-21T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-21T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-21T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-21T10:53:15.708Z-Patient2',
    },
  });
  await app.post('/v1/surveyResponse').send({
    surveyId: FIJI_SAMP_SURVEY_ID,
    startTime: '2021-03-23T10:50:28.133Z',
    patientId: expectedPatient2.id,
    endTime: '2021-03-23T10:53:15.708Z',
    encounterId: encounter8.id,
    answers: {
      'pde-FijCOVSamp4': 'pde-FijCOVSamp4-on-2021-03-23T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp6': 'pde-FijCOVSamp6-on-2021-03-23T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp7': 'pde-FijCOVSamp7-on-2021-03-23T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp10': 'pde-FijCOVSamp10-on-2021-03-23T10:53:15.708Z-Patient2',
      'pde-FijCOVSamp11': 'pde-FijCOVSamp11-on-2021-03-23T10:53:15.708Z-Patient2',
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

  beforeAll(async () => {
    const ctx = await createTestContext();
    const models = ctx.models;
    baseApp = ctx.baseApp;
    village1 = await randomReferenceId(models, 'village');
    village2 = await randomReferenceId(models, 'village');

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

  describe('checks permissions', () => {
    it('should reject creating an assistive technology device line list report with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post(`/v1/reports/covid-swab-lab-test-list`, {});
      expect(result).toBeForbidden();
    });
  });

  describe('returns the correct data', () => {
    it('should return latest data per patient and latest data per patient per date', async () => {
      const result = await app.post('/v1/reports/covid-swab-lab-test-list').send({});
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(5);

      /*******Lab request 1*********/
      //patient details
      const expectedDetails1 = {
        firstName: expectedPatient1.firstName,
        lastName: expectedPatient1.lastName,
        dob: moment(expectedPatient1.dateOfBirth).format('DD-MM-YYYY'),
        sex: expectedPatient1.sex,
        patientId: expectedPatient1.displayId,
        labRequestId: labRequest1.displayId,
        //Fiji Samp collection form
        //always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
        labRequestType: 'COVID-19',
        status: 'Reception pending',
        requestedDate: '10-03-2021',
        publicHealthFacility: 'pde-FijCOVSamp4-on-2021-03-14T10:53:15.708Z-Patient1',
        subDivision: 'pde-FijCOVSamp7-on-2021-03-14T10:53:15.708Z-Patient1',
        ethnicity: 'pde-FijCOVSamp10-on-2021-03-14T10:53:15.708Z-Patient1',
        contactPhone: 'pde-FijCOVSamp11-on-2021-03-14T10:53:15.708Z-Patient1',
      };
      for (const entry of Object.entries(expectedDetails1)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 1, key)).toBe(expectedValue);
      }

      /*******Lab request 2*********/
      //patient details
      const expectedDetails2 = {
        firstName: expectedPatient1.firstName,
        lastName: expectedPatient1.lastName,
        dob: moment(expectedPatient1.dateOfBirth).format('DD-MM-YYYY'),
        sex: expectedPatient1.sex,
        patientId: expectedPatient1.displayId,
        labRequestId: labRequest2.displayId,
        //Fiji Samp collection form
        //always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
        labRequestType: 'COVID-19',
        status: 'Reception pending',
        requestedDate: '16-03-2021',
        publicHealthFacility: 'pde-FijCOVSamp4-on-2021-03-18T10:53:15.708Z-Patient1',
        subDivision: 'pde-FijCOVSamp7-on-2021-03-18T10:53:15.708Z-Patient1',
        ethnicity: 'pde-FijCOVSamp10-on-2021-03-18T10:53:15.708Z-Patient1',
        contactPhone: 'pde-FijCOVSamp11-on-2021-03-18T10:53:15.708Z-Patient1',
      };
      for (const entry of Object.entries(expectedDetails2)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 2, key)).toBe(expectedValue);
      }

      /*******Lab request 3*********/
      //patient details
      const expectedDetails3 = {
        firstName: expectedPatient2.firstName,
        lastName: expectedPatient2.lastName,
        dob: moment(expectedPatient2.dateOfBirth).format('DD-MM-YYYY'),
        sex: expectedPatient2.sex,
        patientId: expectedPatient2.displayId,
        labRequestId: labRequest3.displayId,
        //Fiji Samp collection form
        //always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
        labRequestType: 'COVID-19',
        status: 'Reception pending',
        requestedDate: '17-03-2021',
        publicHealthFacility: 'pde-FijCOVSamp4-on-2021-03-19T10:53:15.708Z-Patient2',
        subDivision: 'pde-FijCOVSamp7-on-2021-03-19T10:53:15.708Z-Patient2',
        ethnicity: 'pde-FijCOVSamp10-on-2021-03-19T10:53:15.708Z-Patient2',
        contactPhone: 'pde-FijCOVSamp11-on-2021-03-19T10:53:15.708Z-Patient2',
      };
      for (const entry of Object.entries(expectedDetails3)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 3, key)).toBe(expectedValue);
      }

      /*******Lab request 4*********/
      const expectedDetails4 = {
        firstName: expectedPatient2.firstName,
        lastName: expectedPatient2.lastName,
        dob: moment(expectedPatient2.dateOfBirth).format('DD-MM-YYYY'),
        sex: expectedPatient2.sex,
        patientId: expectedPatient2.displayId,
        labRequestId: labRequest4.displayId,
        //Fiji Samp collection form
        //always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
        labRequestType: 'COVID-19',
        status: 'Reception pending',
        requestedDate: '20-03-2021',
        publicHealthFacility: 'pde-FijCOVSamp4-on-2021-03-23T10:53:15.708Z-Patient2',
        subDivision: 'pde-FijCOVSamp7-on-2021-03-23T10:53:15.708Z-Patient2',
        ethnicity: 'pde-FijCOVSamp10-on-2021-03-23T10:53:15.708Z-Patient2',
        contactPhone: 'pde-FijCOVSamp11-on-2021-03-23T10:53:15.708Z-Patient2',
      };
      for (const entry of Object.entries(expectedDetails4)) {
        const [key, expectedValue] = entry;
        expect(getProperty(result, 4, key)).toBe(expectedValue);
      }
    });
  });
});
