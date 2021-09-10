import moment from 'moment';
import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
import { createTestContext } from '../../utilities';

const PROGRAM_ID = 'program-assistivetechnologyproject';
const MOBILITY_SURVEY_ID = 'program-assistivetechnologyproject-iraqaddmobilityproduct';
const REGISTRATION_FORM_SURVEY_ID = 'program-assistivetechnologyproject-iraqregistrationform';

describe('Assistive technology device line list', () => {
  let baseApp = null;
  let app = null;
  let expectedPatient1 = null;
  let expectedPatient2 = null;
  let village1 = null;
  let village2 = null;

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

    await models.Program.create({
      id: PROGRAM_ID,
      name: 'Assistive Technology Project',
    });

    await models.ProgramDataElement.bulkCreate([
      { id: 'pde-IrqMAReg-13', code: 'IrqMAReg-13', name: 'pde-IrqMAReg-13' },

      { id: 'pde-IrqPreMob-2', code: 'IrqPreMob-2', name: 'pde-IrqPreMob-2' },
      { id: 'pde-IrqPreMob-1', code: 'IrqPreMob-1', name: 'pde-IrqPreMob-1' },
      { id: 'pde-IrqPreMob-6', code: 'IrqPreMob-6', name: 'pde-IrqPreMob-6' },
      { id: 'pde-IrqPreMob-7', code: 'IrqPreMob-7', name: 'pde-IrqPreMob-7' },
      { id: 'pde-IrqPreMob-8', code: 'IrqPreMob-8', name: 'pde-IrqPreMob-8' },
      { id: 'pde-IrqPreMob-9', code: 'IrqPreMob-9', name: 'pde-IrqPreMob-9' },
    ]);

    await models.Survey.create({
      id: REGISTRATION_FORM_SURVEY_ID,
      name: 'Assistive Technology Project',
      programId: PROGRAM_ID,
    });

    await models.Survey.create({
      id: MOBILITY_SURVEY_ID,
      name: 'Assistive Technology Project',
      programId: PROGRAM_ID,
    });

    await models.SurveyScreenComponent.bulkCreate([
      { dataElementId: 'pde-IrqMAReg-13', surveyId: REGISTRATION_FORM_SURVEY_ID },

      { dataElementId: 'pde-IrqPreMob-2', surveyId: MOBILITY_SURVEY_ID },
      { dataElementId: 'pde-IrqPreMob-1', surveyId: MOBILITY_SURVEY_ID },
      { dataElementId: 'pde-IrqPreMob-6', surveyId: MOBILITY_SURVEY_ID },
      { dataElementId: 'pde-IrqPreMob-7', surveyId: MOBILITY_SURVEY_ID },
      { dataElementId: 'pde-IrqPreMob-8', surveyId: MOBILITY_SURVEY_ID },
      { dataElementId: 'pde-IrqPreMob-9', surveyId: MOBILITY_SURVEY_ID },
    ]);

    // ----Submit answers for patient 1----
    await app.post('/v1/surveyResponse').send({
      surveyId: REGISTRATION_FORM_SURVEY_ID,
      startTime: '2021-03-12T10:50:28.133Z',
      patientId: expectedPatient1.id,
      endTime: '2021-03-12T10:53:15.708Z',
      answers: {
        'pde-IrqMAReg-13': 'pde-IrqMAReg-13-on-2021-03-12T10:53:15.708Z-Patient1',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: REGISTRATION_FORM_SURVEY_ID,
      startTime: '2021-03-15T10:50:28.133Z',
      patientId: expectedPatient1.id,
      endTime: '2021-03-15T10:53:15.708Z',
      answers: {
        'pde-IrqMAReg-13': 'pde-IrqMAReg-13-on-2021-03-15T10:53:15.708Z-Patient1',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-17T10:50:28.133Z',
      patientId: expectedPatient1.id,
      endTime: '2021-03-17T10:53:15.708Z',
      answers: {
        'pde-IrqPreMob-2': 'pde-IrqPreMob-2-on-2021-03-17T10:53:15.708Z-Patient1',
        'pde-IrqPreMob-1': 'pde-IrqPreMob-1-on-2021-03-17T10:53:15.708Z-Patient1',
        'pde-IrqPreMob-6': 'pde-IrqPreMob-6-on-2021-03-17T10:53:15.708Z-Patient1',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-17T11:50:28.133Z',
      patientId: expectedPatient1.id,
      endTime: '2021-03-17T11:53:15.708Z',
      answers: {
        'pde-IrqPreMob-7': 'pde-IrqPreMob-7-on-2021-03-17T11:53:15.708Z-Patient1',
        'pde-IrqPreMob-8': 'pde-IrqPreMob-8-on-2021-03-17T11:53:15.708Z-Patient1',
        'pde-IrqPreMob-9': 'pde-IrqPreMob-9-on-2021-03-17T11:53:15.708Z-Patient1',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-20T10:50:28.133Z',
      patientId: expectedPatient1.id,
      endTime: '2021-03-20T10:53:15.708Z',
      answers: {
        'pde-IrqPreMob-2': 'pde-IrqPreMob-2-on-2021-03-20T10:53:15.708Z-Patient1',
        'pde-IrqPreMob-1': 'pde-IrqPreMob-1-on-2021-03-20T10:53:15.708Z-Patient1',
        'pde-IrqPreMob-6': 'pde-IrqPreMob-6-on-2021-03-20T10:53:15.708Z-Patient1',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-20T11:50:28.133Z',
      patientId: expectedPatient1.id,
      endTime: '2021-03-20T11:53:15.708Z',
      answers: {
        'pde-IrqPreMob-7': 'pde-IrqPreMob-7-on-2021-03-20T11:53:15.708Z-Patient1',
        'pde-IrqPreMob-8': 'pde-IrqPreMob-8-on-2021-03-20T11:53:15.708Z-Patient1',
        'pde-IrqPreMob-9': 'pde-IrqPreMob-9-on-2021-03-20T11:53:15.708Z-Patient1',
      },
    });

    // ----Submit answers for patient 2----
    await app.post('/v1/surveyResponse').send({
      surveyId: REGISTRATION_FORM_SURVEY_ID,
      startTime: '2021-03-12T10:50:28.133Z',
      patientId: expectedPatient2.id,
      endTime: '2021-03-12T10:53:15.708Z',
      answers: {
        'pde-IrqMAReg-13': 'pde-IrqMAReg-13-on-2021-03-12T10:53:15.708Z-Patient2',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-17T10:50:28.133Z',
      patientId: expectedPatient2.id,
      endTime: '2021-03-17T10:53:15.708Z',
      answers: {
        'pde-IrqPreMob-2': 'pde-IrqPreMob-2-on-2021-03-17T10:53:15.708Z-Patient2',
        'pde-IrqPreMob-1': 'pde-IrqPreMob-1-on-2021-03-17T10:53:15.708Z-Patient2',
        'pde-IrqPreMob-6': 'pde-IrqPreMob-6-on-2021-03-17T10:53:15.708Z-Patient2',
      },
    });
  });

  describe('checks permissions', () => {
    it('should reject creating an assistive technology device line list report with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post(
        `/v1/reports/iraq-assistive-technology-device-line-list`,
        {},
      );
      expect(result).toBeForbidden();
    });
  });

  describe('returns the correct data', () => {
    it('should return latest data per patient and latest data per patient per date', async () => {
      const result = await app
        .post('/v1/reports/iraq-assistive-technology-device-line-list')
        .send({});

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(4);

      /*******PATIENT 1*********/
      //-----Row on 2021-03-17-----//, on this date, there are answers submitted for 2 patients: patient1 and patient2
      //patient details
      expect(result.body[1][0]).toBe(expectedPatient1.displayId);
      expect(result.body[1][1]).toBe(expectedPatient1.sex);
      expect(result.body[1][2]).toBe(moment(expectedPatient1.dateOfBirth).format('DD-MM-YYYY'));

      //always grab the latest answer for a data element for that patient.
      expect(result.body[1][5]).toBe('pde-IrqMAReg-13-on-2021-03-15T10:53:15.708Z-Patient1');

      //always grab the latest answer for a data element within that date, regardless of survey response,
      expect(result.body[1][6]).toBe('pde-IrqPreMob-2-on-2021-03-17T10:53:15.708Z-Patient1');
      expect(result.body[1][7]).toBe('pde-IrqPreMob-1-on-2021-03-17T10:53:15.708Z-Patient1');
      expect(result.body[1][8]).toBe('pde-IrqPreMob-6-on-2021-03-17T10:53:15.708Z-Patient1');
      expect(result.body[1][9]).toBe('pde-IrqPreMob-7-on-2021-03-17T11:53:15.708Z-Patient1');
      expect(result.body[1][10]).toBe('pde-IrqPreMob-8-on-2021-03-17T11:53:15.708Z-Patient1');
      expect(result.body[1][11]).toBe('pde-IrqPreMob-9-on-2021-03-17T11:53:15.708Z-Patient1');

      //-----Row on 2021-03-20-----//, on this date, there are answers submitted for only 1 patient
      //patient details
      expect(result.body[2][0]).toBe(expectedPatient1.displayId);
      expect(result.body[2][1]).toBe(expectedPatient1.sex);
      expect(result.body[2][2]).toBe(moment(expectedPatient1.dateOfBirth).format('DD-MM-YYYY'));

      //always grab the latest answer for a data element for that patient.
      expect(result.body[2][5]).toBe('pde-IrqMAReg-13-on-2021-03-15T10:53:15.708Z-Patient1');

      //always grab the latest answer for a data element within that date, regardless of survey response
      expect(result.body[2][6]).toBe('pde-IrqPreMob-2-on-2021-03-20T10:53:15.708Z-Patient1');
      expect(result.body[2][7]).toBe('pde-IrqPreMob-1-on-2021-03-20T10:53:15.708Z-Patient1');
      expect(result.body[2][8]).toBe('pde-IrqPreMob-6-on-2021-03-20T10:53:15.708Z-Patient1');
      expect(result.body[2][9]).toBe('pde-IrqPreMob-7-on-2021-03-20T11:53:15.708Z-Patient1');
      expect(result.body[2][10]).toBe('pde-IrqPreMob-8-on-2021-03-20T11:53:15.708Z-Patient1');
      expect(result.body[2][11]).toBe('pde-IrqPreMob-9-on-2021-03-20T11:53:15.708Z-Patient1');
      /******************************/

      /*******PATIENT 2*********/
      //-----Row on 2021-03-17-----//, on this date, there are answers submitted for 2 patients: patient1 and patient2
      //patient details
      expect(result.body[3][0]).toBe(expectedPatient2.displayId);
      expect(result.body[3][1]).toBe(expectedPatient2.sex);
      expect(result.body[3][2]).toBe(moment(expectedPatient2.dateOfBirth).format('DD-MM-YYYY'));

      //always grab the latest answer for a data element for that patient.
      expect(result.body[3][5]).toBe('pde-IrqMAReg-13-on-2021-03-12T10:53:15.708Z-Patient2');

      //always grab the latest answer for a data element within that date, regardless of survey response,
      expect(result.body[3][6]).toBe('pde-IrqPreMob-2-on-2021-03-17T10:53:15.708Z-Patient2');
      expect(result.body[3][7]).toBe('pde-IrqPreMob-1-on-2021-03-17T10:53:15.708Z-Patient2');
      expect(result.body[3][8]).toBe('pde-IrqPreMob-6-on-2021-03-17T10:53:15.708Z-Patient2');
      expect(result.body[3][9]).toBe(null);
      expect(result.body[3][10]).toBe(null);
      expect(result.body[3][11]).toBe(null);
      /******************************/
    });

    it('should return data within date range', async () => {
      const result = await app
        .post('/v1/reports/iraq-assistive-technology-device-line-list')
        .send({ parameters: { fromDate: '2021-03-18T00:00:00Z', toDate: '2021-03-21T00:00:00Z' } });

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(2);

      expect(result.body[1][0]).toBe(expectedPatient1.displayId);
      expect(result.body[1][1]).toBe(expectedPatient1.sex);
      expect(result.body[1][2]).toBe(moment(expectedPatient1.dateOfBirth).format('DD-MM-YYYY'));
      expect(result.body[1][6]).toBe('pde-IrqPreMob-2-on-2021-03-20T10:53:15.708Z-Patient1');
      expect(result.body[1][7]).toBe('pde-IrqPreMob-1-on-2021-03-20T10:53:15.708Z-Patient1');
      expect(result.body[1][8]).toBe('pde-IrqPreMob-6-on-2021-03-20T10:53:15.708Z-Patient1');
      expect(result.body[1][9]).toBe('pde-IrqPreMob-7-on-2021-03-20T11:53:15.708Z-Patient1');
      expect(result.body[1][10]).toBe('pde-IrqPreMob-8-on-2021-03-20T11:53:15.708Z-Patient1');
      expect(result.body[1][11]).toBe('pde-IrqPreMob-9-on-2021-03-20T11:53:15.708Z-Patient1');
    });
  });
});
