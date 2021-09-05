import moment from 'moment';
import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
import { createTestContext } from '../../utilities';

const PROGRAM_ID = 'program-assistivetechnologyproject';
const MOBILITY_SURVEY_ID = 'program-assistivetechnologyproject-iraqaddmobilityproduct';
const REGISTRATION_FORM_SURVEY_ID = 'program-assistivetechnologyproject-iraqregistrationform';

describe('Assistive technology device line list', () => {
  let baseApp = null;
  let app = null;
  let expectedPatient = null;
  let village;

  beforeAll(async () => {
    const ctx = await createTestContext();
    const models = ctx.models;
    baseApp = ctx.baseApp;
    village = await randomReferenceId(models, 'village');

    expectedPatient = await models.Patient.create(
      await createDummyPatient(models, { villageId: village }),
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

    await app.post('/v1/surveyResponse').send({
      surveyId: REGISTRATION_FORM_SURVEY_ID,
      startTime: '2021-03-12T10:50:28.133Z',
      patientId: expectedPatient.id,
      endTime: '2021-03-12T10:53:15.708Z',
      answers: {
        'pde-IrqMAReg-13': 'pde-IrqMAReg-13-on-2021-03-12T10:53:15.708Z',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: REGISTRATION_FORM_SURVEY_ID,
      startTime: '2021-03-15T10:50:28.133Z',
      patientId: expectedPatient.id,
      endTime: '2021-03-15T10:53:15.708Z',
      answers: {
        'pde-IrqMAReg-13': 'pde-IrqMAReg-13-on-2021-03-15T10:53:15.708Z',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-17T10:50:28.133Z',
      patientId: expectedPatient.id,
      endTime: '2021-03-17T10:53:15.708Z',
      answers: {
        'pde-IrqPreMob-2': 'pde-IrqPreMob-2-on-2021-03-17T10:53:15.708Z',
        'pde-IrqPreMob-1': 'pde-IrqPreMob-1-on-2021-03-17T10:53:15.708Z',
        'pde-IrqPreMob-6': 'pde-IrqPreMob-6-on-2021-03-17T10:53:15.708Z',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-17T11:50:28.133Z',
      patientId: expectedPatient.id,
      endTime: '2021-03-17T11:53:15.708Z',
      answers: {
        'pde-IrqPreMob-7': 'pde-IrqPreMob-7-on-2021-03-17T11:53:15.708Z',
        'pde-IrqPreMob-8': 'pde-IrqPreMob-8-on-2021-03-17T11:53:15.708Z',
        'pde-IrqPreMob-9': 'pde-IrqPreMob-9-on-2021-03-17T11:53:15.708Z',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-20T10:50:28.133Z',
      patientId: expectedPatient.id,
      endTime: '2021-03-20T10:53:15.708Z',
      answers: {
        'pde-IrqPreMob-2': 'pde-IrqPreMob-2-on-2021-03-20T10:53:15.708Z',
        'pde-IrqPreMob-1': 'pde-IrqPreMob-1-on-2021-03-20T10:53:15.708Z',
        'pde-IrqPreMob-6': 'pde-IrqPreMob-6-on-2021-03-20T10:53:15.708Z',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-20T11:50:28.133Z',
      patientId: expectedPatient.id,
      endTime: '2021-03-20T11:53:15.708Z',
      answers: {
        'pde-IrqPreMob-7': 'pde-IrqPreMob-7-on-2021-03-20T11:53:15.708Z',
        'pde-IrqPreMob-8': 'pde-IrqPreMob-8-on-2021-03-20T11:53:15.708Z',
        'pde-IrqPreMob-9': 'pde-IrqPreMob-9-on-2021-03-20T11:53:15.708Z',
      },
    });
  });

  it('should reject creating an assistive technology device line list report with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post(
      `/v1/reports/iraq-assistive-technology-device-line-list`,
      {},
    );
    expect(result).toBeForbidden();
  });

  describe('returns the correct data', () => {
    it('should return data for patients per date', async () => {
      const result = await app
        .post('/v1/reports/iraq-assistive-technology-device-line-list')
        .send({});

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(3);

      //-----Row on 2021-03-17-----//,
      //patient details
      expect(result.body[1][0]).toBe(expectedPatient.displayId);
      expect(result.body[1][1]).toBe(expectedPatient.sex);
      expect(result.body[1][2]).toBe(moment(expectedPatient.dateOfBirth).format('DD-MM-YYYY'));

      //always grab the latest answer for a data element for that patient.
      expect(result.body[1][4]).toBe('pde-IrqMAReg-13-on-2021-03-15T10:53:15.708Z');

      //always grab the latest answer for a data element within that date, regardless of survey response,
      expect(result.body[1][5]).toBe('pde-IrqPreMob-2-on-2021-03-17T10:53:15.708Z');
      expect(result.body[1][6]).toBe('pde-IrqPreMob-1-on-2021-03-17T10:53:15.708Z');
      expect(result.body[1][7]).toBe('pde-IrqPreMob-6-on-2021-03-17T10:53:15.708Z');
      expect(result.body[1][8]).toBe('pde-IrqPreMob-7-on-2021-03-17T11:53:15.708Z');
      expect(result.body[1][9]).toBe('pde-IrqPreMob-8-on-2021-03-17T11:53:15.708Z');
      expect(result.body[1][10]).toBe('pde-IrqPreMob-9-on-2021-03-17T11:53:15.708Z');

      //-----Row on 2021-03-20-----//,
      //patient details
      expect(result.body[2][0]).toBe(expectedPatient.displayId);
      expect(result.body[2][1]).toBe(expectedPatient.sex);
      expect(result.body[2][2]).toBe(moment(expectedPatient.dateOfBirth).format('DD-MM-YYYY'));

      //always grab the latest answer for a data element for that patient.
      expect(result.body[2][4]).toBe('pde-IrqMAReg-13-on-2021-03-15T10:53:15.708Z');

      //always grab the latest answer for a data element within that date, regardless of survey response
      expect(result.body[2][5]).toBe('pde-IrqPreMob-2-on-2021-03-20T10:53:15.708Z');
      expect(result.body[2][6]).toBe('pde-IrqPreMob-1-on-2021-03-20T10:53:15.708Z');
      expect(result.body[2][7]).toBe('pde-IrqPreMob-6-on-2021-03-20T10:53:15.708Z');
      expect(result.body[2][8]).toBe('pde-IrqPreMob-7-on-2021-03-20T11:53:15.708Z');
      expect(result.body[2][9]).toBe('pde-IrqPreMob-8-on-2021-03-20T11:53:15.708Z');
      expect(result.body[2][10]).toBe('pde-IrqPreMob-9-on-2021-03-20T11:53:15.708Z');
    });
  });
});
