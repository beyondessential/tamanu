import moment from 'moment';
import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceId,
} from 'shared/demoData/patients';
import { randomLabRequest } from 'shared/demoData';
import { createTestContext } from '../../utilities';

const PROGRAM_ID = 'program-fijicovid19';
const FIJI_SAMP_SURVEY_ID = 'program-fijicovid19-fijicovidsampcollection';

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
      expect(result.body[1][0]).toBe(expectedPatient1.firstName);
      expect(result.body[1][1]).toBe(expectedPatient1.lastName);
      expect(result.body[1][2]).toBe(moment(expectedPatient1.dateOfBirth).format('DD-MM-YYYY'));
      expect(result.body[1][3]).toBe(expectedPatient1.sex);
      expect(result.body[1][4]).toBe(expectedPatient1.displayId);
      expect(result.body[1][9]).toBe(labRequest1.displayId);

      //Fiji Samp collection form
      //always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
      expect(result.body[1][10]).toBe('COVID-19');
      expect(result.body[1][11]).toBe('Reception pending');
      expect(result.body[1][14]).toBe('10-03-2021');
      expect(result.body[1][18]).toBe('pde-FijCOVSamp4-on-2021-03-14T10:53:15.708Z-Patient1');
      expect(result.body[1][20]).toBe('pde-FijCOVSamp6-on-2021-03-14T10:53:15.708Z-Patient1');
      expect(result.body[1][21]).toBe('pde-FijCOVSamp7-on-2021-03-14T10:53:15.708Z-Patient1');
      expect(result.body[1][22]).toBe('pde-FijCOVSamp10-on-2021-03-14T10:53:15.708Z-Patient1');
      expect(result.body[1][23]).toBe('pde-FijCOVSamp11-on-2021-03-14T10:53:15.708Z-Patient1');

      /*******Lab request 2*********/
      //patient details
      expect(result.body[2][0]).toBe(expectedPatient1.firstName);
      expect(result.body[2][1]).toBe(expectedPatient1.lastName);
      expect(result.body[2][2]).toBe(moment(expectedPatient1.dateOfBirth).format('DD-MM-YYYY'));
      expect(result.body[2][3]).toBe(expectedPatient1.sex);
      expect(result.body[2][4]).toBe(expectedPatient1.displayId);
      expect(result.body[2][9]).toBe(labRequest2.displayId);

      //Fiji Samp collection form
      //always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
      expect(result.body[2][10]).toBe('COVID-19');
      expect(result.body[2][11]).toBe('Reception pending');
      expect(result.body[2][14]).toBe('16-03-2021');
      expect(result.body[2][18]).toBe('pde-FijCOVSamp4-on-2021-03-18T10:53:15.708Z-Patient1');
      expect(result.body[2][20]).toBe('pde-FijCOVSamp6-on-2021-03-18T10:53:15.708Z-Patient1');
      expect(result.body[2][21]).toBe('pde-FijCOVSamp7-on-2021-03-18T10:53:15.708Z-Patient1');
      expect(result.body[2][22]).toBe('pde-FijCOVSamp10-on-2021-03-18T10:53:15.708Z-Patient1');
      expect(result.body[2][23]).toBe('pde-FijCOVSamp11-on-2021-03-18T10:53:15.708Z-Patient1');

      /*******Lab request 3*********/
      //patient details
      expect(result.body[3][0]).toBe(expectedPatient2.firstName);
      expect(result.body[3][1]).toBe(expectedPatient2.lastName);
      expect(result.body[3][2]).toBe(moment(expectedPatient2.dateOfBirth).format('DD-MM-YYYY'));
      expect(result.body[3][3]).toBe(expectedPatient2.sex);
      expect(result.body[3][4]).toBe(expectedPatient2.displayId);
      expect(result.body[3][9]).toBe(labRequest3.displayId);

      //Fiji Samp collection form
      //always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
      expect(result.body[3][10]).toBe('COVID-19');
      expect(result.body[3][11]).toBe('Reception pending');
      expect(result.body[3][14]).toBe('17-03-2021');
      expect(result.body[3][18]).toBe('pde-FijCOVSamp4-on-2021-03-19T10:53:15.708Z-Patient2');
      expect(result.body[3][20]).toBe('pde-FijCOVSamp6-on-2021-03-19T10:53:15.708Z-Patient2');
      expect(result.body[3][21]).toBe('pde-FijCOVSamp7-on-2021-03-19T10:53:15.708Z-Patient2');
      expect(result.body[3][22]).toBe('pde-FijCOVSamp10-on-2021-03-19T10:53:15.708Z-Patient2');
      expect(result.body[3][23]).toBe('pde-FijCOVSamp11-on-2021-03-19T10:53:15.708Z-Patient2');

      /*******Lab request 4*********/
      //patient details
      expect(result.body[4][0]).toBe(expectedPatient2.firstName);
      expect(result.body[4][1]).toBe(expectedPatient2.lastName);
      expect(result.body[4][2]).toBe(moment(expectedPatient2.dateOfBirth).format('DD-MM-YYYY'));
      expect(result.body[4][3]).toBe(expectedPatient2.sex);
      expect(result.body[4][4]).toBe(expectedPatient2.displayId);
      expect(result.body[4][9]).toBe(labRequest4.displayId);

      //Fiji Samp collection form
      //always grab the latest answer between the current lab request and the next lab request, regardless of survey response,
      expect(result.body[4][10]).toBe('COVID-19');
      expect(result.body[4][11]).toBe('Reception pending');
      expect(result.body[4][14]).toBe('20-03-2021');
      expect(result.body[4][18]).toBe('pde-FijCOVSamp4-on-2021-03-23T10:53:15.708Z-Patient2');
      expect(result.body[4][20]).toBe('pde-FijCOVSamp6-on-2021-03-23T10:53:15.708Z-Patient2');
      expect(result.body[4][21]).toBe('pde-FijCOVSamp7-on-2021-03-23T10:53:15.708Z-Patient2');
      expect(result.body[4][22]).toBe('pde-FijCOVSamp10-on-2021-03-23T10:53:15.708Z-Patient2');
      expect(result.body[4][23]).toBe('pde-FijCOVSamp11-on-2021-03-23T10:53:15.708Z-Patient2');
    });
  });
});
