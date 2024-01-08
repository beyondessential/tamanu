import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceId,
} from '@tamanu/shared/demoData/patients';
import {
  createDummyAefiSurveyAnswers,
  createDummyAefiProgramDataElements,
  createDummyAefiSurveyScreenComponent,
} from '@tamanu/shared/demoData';
import { createAdministeredVaccine, createScheduledVaccine } from '@tamanu/shared/demoData/vaccines';
import { createTestContext } from '../../utilities';
import { parseISO } from 'date-fns';

describe('AEFI report', () => {
  let baseApp = null;
  let app = null;
  let expectedPatient = null;
  let wrongVillagePatient = null;
  let scheduledVaccine1 = null;
  let scheduledVaccine2 = null;
  let village;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    const models = ctx.models;
    baseApp = ctx.baseApp;
    village = await randomReferenceId(models, 'village');

    await models.Survey.truncate({ cascade: true });
    await models.Program.truncate({ cascade: true });
    await models.Program.truncate({ cascade: true });
    await models.ProgramDataElement.truncate({ cascade: true });

    expectedPatient = await models.Patient.create(
      await createDummyPatient(models, { villageId: village }),
    );
    wrongVillagePatient = await models.Patient.create(await createDummyPatient(models));
    app = await baseApp.asRole('practitioner');

    await models.Program.create({
      id: 'program-aefi',
      name: 'AEFI Report',
    });

    await models.ProgramDataElement.bulkCreate(createDummyAefiProgramDataElements());

    await models.Survey.create({
      id: 'program-aefi/survey-aefi_immunisation',
      name: 'Immunisation',
      programId: 'program-aefi',
    });

    await models.SurveyScreenComponent.bulkCreate(createDummyAefiSurveyScreenComponent());

    const encounter1 = await models.Encounter.create(
      await createDummyEncounter(models, { patientId: expectedPatient.id, current: true }),
    );

    const encounter2 = await models.Encounter.create(
      await createDummyEncounter(models, { patientId: expectedPatient.id, current: true }),
    );

    await models.Encounter.create(
      await createDummyEncounter(models, { patientId: wrongVillagePatient.id, current: true }),
    );

    await app.post('/v1/surveyResponse').send({
      surveyId: 'program-aefi/survey-aefi_immunisation',
      startTime: '2021-03-17T21:50:28.133Z',
      patientId: expectedPatient.id,
      endTime: '2021-03-17T21:53:15.708Z',
      answers: createDummyAefiSurveyAnswers(),
    });

    await app.post('/v1/surveyResponse').send({
      surveyId: 'program-aefi/survey-aefi_immunisation',
      startTime: '2021-03-17T21:50:28.133Z',
      patientId: wrongVillagePatient.id,
      endTime: '2021-03-17T21:53:15.708Z',
      answers: createDummyAefiSurveyAnswers(),
    });

    scheduledVaccine1 = await models.ScheduledVaccine.create(
      await createScheduledVaccine(models, {
        label: 'vaccine 1',
        schedule: 'Dose 1',
      }),
    );
    scheduledVaccine2 = await models.ScheduledVaccine.create(
      await createScheduledVaccine(models, {
        label: 'vaccine 2',
        schedule: 'Dose 2',
      }),
    );

    await models.AdministeredVaccine.create(
      await createAdministeredVaccine(models, {
        scheduledVaccineId: scheduledVaccine1.id,
        encounterId: encounter1.id,
        date: parseISO('2021-03-10'),
      }),
    );

    await models.AdministeredVaccine.create(
      await createAdministeredVaccine(models, {
        scheduledVaccineId: scheduledVaccine2.id,
        encounterId: encounter2.id,
        date: parseISO('2021-03-15'),
      }),
    );
  });
  afterAll(() => ctx.close());

  it('should reject creating an aefi report with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post(`/v1/reports/aefi`, {});
    expect(result).toBeForbidden();
  });

  describe('returns data based on parameters', () => {
    it('should return data for patients of the right village', async () => {
      const result = await app.post('/v1/reports/aefi').send({
        parameters: { village: village, fromDate: '2021-03-15' },
      });

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(2);
      expect(result.body[1][1]).toBe(expectedPatient.displayId);
      expect(result.body[1][2]).toBe('vaccine 2, Dose 2');
    });
  });
});
