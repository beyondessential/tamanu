import { format } from '@tamanu/shared/utils/dateTime';
import { createDummyPatient, randomReferenceIds } from '@tamanu/shared/demoData/patients';
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
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    const { models } = ctx;

    await models.SurveyResponseAnswer.truncate({ cascade: true });
    await models.SurveyResponse.truncate({ cascade: true });
    await models.SurveyScreenComponent.truncate({ cascade: true });
    await models.ProgramDataElement.truncate({ cascade: true });
    await models.Survey.truncate({ cascade: true });
    await models.Program.truncate({ cascade: true });
    await models.PatientAdditionalData.truncate({ cascade: true });
    await models.Patient.truncate({ cascade: true });

    baseApp = ctx.baseApp;
    [village1, village2] = await randomReferenceIds(models, 'village', 2);

    expectedPatient1 = await models.Patient.create(
      await createDummyPatient(models, { id: 'AAAAAA', villageId: village1 }),
    );
    expectedPatient2 = await models.Patient.create(
      await createDummyPatient(models, { id: 'BBBBBB', villageId: village2 }),
    );

    app = await baseApp.asRole('practitioner');

    await models.Program.create({
      id: PROGRAM_ID,
      name: 'Assistive Technology Project',
    });

    await models.ProgramDataElement.bulkCreate([
      { id: 'pde-IrqMAReg-13', code: 'IrqMAReg-13', name: 'pde-IrqMAReg-13', type: 'FreeText' },

      { id: 'pde-IrqPreMob-2', code: 'IrqPreMob-2', name: 'pde-IrqPreMob-2', type: 'FreeText' },
      { id: 'pde-IrqPreMob-1', code: 'IrqPreMob-1', name: 'pde-IrqPreMob-1', type: 'FreeText' },
      { id: 'pde-IrqPreMob-6', code: 'IrqPreMob-6', name: 'pde-IrqPreMob-6', type: 'FreeText' },
      { id: 'pde-IrqPreMob-7', code: 'IrqPreMob-7', name: 'pde-IrqPreMob-7', type: 'FreeText' },
      { id: 'pde-IrqPreMob-8', code: 'IrqPreMob-8', name: 'pde-IrqPreMob-8', type: 'FreeText' },
      { id: 'pde-IrqPreMob-9', code: 'IrqPreMob-9', name: 'pde-IrqPreMob-9', type: 'FreeText' },
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
      startTime: '2021-03-12 10:50:28',
      patientId: expectedPatient1.id,
      endTime: '2021-03-12 10:53:15',
      answers: {
        'pde-IrqMAReg-13': 'pde-IrqMAReg-13-on-2021-03-12 10:53:15-Patient1',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: REGISTRATION_FORM_SURVEY_ID,
      startTime: '2021-03-15 10:50:28',
      patientId: expectedPatient1.id,
      endTime: '2021-03-15 10:53:15',
      answers: {
        'pde-IrqMAReg-13': 'pde-IrqMAReg-13-on-2021-03-15 10:53:15-Patient1',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-17 10:50:28',
      patientId: expectedPatient1.id,
      endTime: '2021-03-17 10:53:15',
      answers: {
        'pde-IrqPreMob-2': 'pde-IrqPreMob-2-on-2021-03-17 10:53:15-Patient1',
        'pde-IrqPreMob-1': 'pde-IrqPreMob-1-on-2021-03-17 10:53:15-Patient1',
        'pde-IrqPreMob-6': 'pde-IrqPreMob-6-on-2021-03-17 10:53:15-Patient1',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-17 11:50:28',
      patientId: expectedPatient1.id,
      endTime: '2021-03-17 11:53:15',
      answers: {
        'pde-IrqPreMob-7': 'pde-IrqPreMob-7-on-2021-03-17 11:53:15-Patient1',
        'pde-IrqPreMob-8': 'pde-IrqPreMob-8-on-2021-03-17 11:53:15-Patient1',
        'pde-IrqPreMob-9': 'pde-IrqPreMob-9-on-2021-03-17 11:53:15-Patient1',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-20 10:50:28',
      patientId: expectedPatient1.id,
      endTime: '2021-03-20 10:53:15',
      answers: {
        'pde-IrqPreMob-2': 'pde-IrqPreMob-2-on-2021-03-20 10:53:15-Patient1',
        'pde-IrqPreMob-1': 'pde-IrqPreMob-1-on-2021-03-20 10:53:15-Patient1',
        'pde-IrqPreMob-6': 'pde-IrqPreMob-6-on-2021-03-20 10:53:15-Patient1',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-20 11:50:28',
      patientId: expectedPatient1.id,
      endTime: '2021-03-20 11:53:15',
      answers: {
        'pde-IrqPreMob-7': 'pde-IrqPreMob-7-on-2021-03-20 11:53:15-Patient1',
        'pde-IrqPreMob-8': 'pde-IrqPreMob-8-on-2021-03-20 11:53:15-Patient1',
        'pde-IrqPreMob-9': 'pde-IrqPreMob-9-on-2021-03-20 11:53:15-Patient1',
      },
    });

    // ----Submit answers for patient 2----
    await app.post('/v1/surveyResponse').send({
      surveyId: REGISTRATION_FORM_SURVEY_ID,
      startTime: '2021-03-12 10:50:28',
      patientId: expectedPatient2.id,
      endTime: '2021-03-12 10:53:15',
      answers: {
        'pde-IrqMAReg-13': 'pde-IrqMAReg-13-on-2021-03-12 10:53:15-Patient2',
      },
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: MOBILITY_SURVEY_ID,
      startTime: '2021-03-17 10:50:28',
      patientId: expectedPatient2.id,
      endTime: '2021-03-17 10:53:15',
      answers: {
        'pde-IrqPreMob-2': 'pde-IrqPreMob-2-on-2021-03-17 10:53:15-Patient2',
        'pde-IrqPreMob-1': 'pde-IrqPreMob-1-on-2021-03-17 10:53:15-Patient2',
        'pde-IrqPreMob-6': 'pde-IrqPreMob-6-on-2021-03-17 10:53:15-Patient2',
      },
    });
  });
  afterAll(() => ctx.close());

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

      expect(result.body).toEqual([
        /* HEADERS */
        [
          'Client ID',
          'Gender',
          'Date of Birth',
          'Age',
          'PHCC provider (مزود الرعاية الصحية الأولية)',
          'Difficulty with mobility/seeing/hearing etc (هل لديك صعوبة مع)',
          'Provider ( المزود)',
          'Date of provision (تم تقديم التاريخ)',
          'Quad stick (عكاز عصا رباعية)',
          'Walking stick (عصا المشي)',
          'Elbow crutches (عكازات الكوع)',
          'Axillary crutches (pair)',
          'Walking frame (without wheels) (إطار المشي (بدون عجلات) - مشاية)',
          'Rubber tips (أطراف مطاطية)',
          'Date of referral (تاريخ الإحالة)',
          'Health care referrals (الرعاىة الصحية)',
          'Other health care referrals (ان كان هنالك إجابات أخرى  اوصف ذلك)',
          'Other service referrals (خدمة أخرى)',
          'Other, other service referrals (ان كان هنالك إجابات أخرى  اوصف ذلك)',
        ],

        /* ****** PATIENT 1 ******** */
        // -----Row on 2021-03-17-----//, on this date, there are answers submitted for 2 patients: patient1 and patient2
        [
          // patient details
          expectedPatient1.displayId,
          expectedPatient1.sex,
          format(expectedPatient1.dateOfBirth, 'dd-MM-yyyy'),
          expect.any(Number),
          null,

          // always grab the latest answer for a data element for that patient.
          'pde-IrqMAReg-13-on-2021-03-15 10:53:15-Patient1',

          // always grab the latest answer for a data element within that date, regardless of survey response,
          'pde-IrqPreMob-2-on-2021-03-17 10:53:15-Patient1',
          'pde-IrqPreMob-1-on-2021-03-17 10:53:15-Patient1',
          'pde-IrqPreMob-6-on-2021-03-17 10:53:15-Patient1',
          'pde-IrqPreMob-7-on-2021-03-17 11:53:15-Patient1',
          'pde-IrqPreMob-8-on-2021-03-17 11:53:15-Patient1',
          'pde-IrqPreMob-9-on-2021-03-17 11:53:15-Patient1',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],

        // -----Row on 2021-03-20-----//, on this date, there are answers submitted for only 1 patient
        [
          // patient details
          expectedPatient1.displayId,
          expectedPatient1.sex,
          format(expectedPatient1.dateOfBirth, 'dd-MM-yyyy'),
          expect.any(Number),
          null,

          // always grab the latest answer for a data element for that patient.
          'pde-IrqMAReg-13-on-2021-03-15 10:53:15-Patient1',

          // always grab the latest answer for a data element within that date, regardless of survey response
          'pde-IrqPreMob-2-on-2021-03-20 10:53:15-Patient1',
          'pde-IrqPreMob-1-on-2021-03-20 10:53:15-Patient1',
          'pde-IrqPreMob-6-on-2021-03-20 10:53:15-Patient1',
          'pde-IrqPreMob-7-on-2021-03-20 11:53:15-Patient1',
          'pde-IrqPreMob-8-on-2021-03-20 11:53:15-Patient1',
          'pde-IrqPreMob-9-on-2021-03-20 11:53:15-Patient1',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],

        /* ******PATIENT 2******** */
        // -----Row on 2021-03-17-----//, on this date, there are answers submitted for 2 patients: patient1 and patient2
        [
          // patient details
          expectedPatient2.displayId,
          expectedPatient2.sex,
          format(expectedPatient2.dateOfBirth, 'dd-MM-yyyy'),
          expect.any(Number),
          null,

          // always grab the latest answer for a data element for that patient.
          'pde-IrqMAReg-13-on-2021-03-12 10:53:15-Patient2',

          // always grab the latest answer for a data element within that date, regardless of survey response,
          'pde-IrqPreMob-2-on-2021-03-17 10:53:15-Patient2',
          'pde-IrqPreMob-1-on-2021-03-17 10:53:15-Patient2',
          'pde-IrqPreMob-6-on-2021-03-17 10:53:15-Patient2',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
      ]);
    });

    it('should return data within date range', async () => {
      const result = await app
        .post('/v1/reports/iraq-assistive-technology-device-line-list')
        .send({ parameters: { fromDate: '2021-03-18', toDate: '2021-03-21' } });

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(2);

      expect(result.body[1][0]).toBe(expectedPatient1.displayId);
      expect(result.body[1][1]).toBe(expectedPatient1.sex);
      expect(result.body[1][2]).toBe(format(expectedPatient1.dateOfBirth, 'dd-MM-yyyy'));
      expect(result.body[1][6]).toBe('pde-IrqPreMob-2-on-2021-03-20 10:53:15-Patient1');
      expect(result.body[1][7]).toBe('pde-IrqPreMob-1-on-2021-03-20 10:53:15-Patient1');
      expect(result.body[1][8]).toBe('pde-IrqPreMob-6-on-2021-03-20 10:53:15-Patient1');
      expect(result.body[1][9]).toBe('pde-IrqPreMob-7-on-2021-03-20 11:53:15-Patient1');
      expect(result.body[1][10]).toBe('pde-IrqPreMob-8-on-2021-03-20 11:53:15-Patient1');
      expect(result.body[1][11]).toBe('pde-IrqPreMob-9-on-2021-03-20 11:53:15-Patient1');
    });
  });
});
