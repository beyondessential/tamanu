import { createDummyEncounter, createDummyPatient, randomVitals } from 'shared/demoData/patients';
import { VACCINE_CATEGORIES } from 'shared/constants';
import { createAdministeredVaccine, createScheduledVaccine } from 'shared/demoData/vaccines';
import { createTestContext } from '../utilities';
import { VACCINE_STATUS } from 'shared/constants/vaccines';

describe('PatientVaccine', () => {
  let ctx;
  let models = null;
  let app = null;
  let baseApp = null;

  let scheduled1 = null;
  let scheduled2 = null;
  let scheduled3 = null;
  
  let patient = null;

  const administerVaccine = async (patient, vaccine, overrides) => {
    const encounter = await models.Encounter.create(
      await createDummyEncounter(models, { patientId: patient.id }),
    );
    await models.AdministeredVaccine.create(
      await createAdministeredVaccine(models, {
        scheduledVaccineId: vaccine.id,
        encounterId: encounter.id,
        ...overrides,
      }),
    );
  };

  beforeAll(async () => {``
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');

    await models.ScheduledVaccine.truncate({ cascade: true });
    await models.AdministeredVaccine.truncate({ cascade: true });

    // set up reference data
    // create 3 scheduled vaccines, 2 routine and 1 campaign
    scheduled1 = await models.ScheduledVaccine.create(
      await createScheduledVaccine(models, {
        category: VACCINE_CATEGORIES.ROUTINE,
        label: 'vaccine 1',
        schedule: 'Dose 1',
      }),
    );
    scheduled2 = await models.ScheduledVaccine.create(
      await createScheduledVaccine(models, {
        category: VACCINE_CATEGORIES.ROUTINE,
        label: 'vaccine 1',
        schedule: 'Dose 2',
      }),
    );
    scheduled3 = await models.ScheduledVaccine.create(
      await createScheduledVaccine(models, { category: VACCINE_CATEGORIES.CAMPAIGN }),
    );
    
    // set up clinical data
    patient = await models.Patient.create(await createDummyPatient(models));
    await administerVaccine(patient, scheduled2);

  });

  afterAll(() => ctx.close());

  it('should reject with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.get(`/v1/patient/${patient.id}/scheduledVaccines`, {});
    expect(result).toBeForbidden();
  });

  describe('Scheduled vaccines', () => {
    it('should get a list of scheduled vaccines', async () => {
      const result = await app.get(`/v1/patient/${patient.id}/scheduledVaccines`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(2);
    });

    it('should get a list of scheduled vaccines based on category', async () => {
      const result = await app.get(
        `/v1/patient/${patient.id}/scheduledVaccines?category=${VACCINE_CATEGORIES.CAMPAIGN}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0]).toHaveProperty('id', scheduled3.id);
    });

    it('should indicate administered vaccine', async () => {
      // add an administered vaccine for patient1, of schedule 2

      const result = await app.get(
        `/v1/patient/${patient.id}/scheduledVaccines?category=${VACCINE_CATEGORIES.ROUTINE}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0].schedules).toEqual([
        { administered: false, schedule: 'Dose 1', scheduledVaccineId: scheduled1.id },
        { administered: true, schedule: 'Dose 2', scheduledVaccineId: scheduled2.id },
      ]);
    });

    it('should indicate pending vaccine', async () => {
      // just create a new patient with no vaccinations     
      const freshPatient = await models.Patient.create(await createDummyPatient(models));
      const result = await app.get(
        `/v1/patient/${freshPatient.id}/scheduledVaccines?category=${VACCINE_CATEGORIES.ROUTINE}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0].schedules).toEqual([
        { administered: false, schedule: 'Dose 1', scheduledVaccineId: scheduled1.id },
        { administered: false, schedule: 'Dose 2', scheduledVaccineId: scheduled2.id },
      ]);
    });
  });

  describe('Administered vaccines', () => {
    it('Should get administered vaccines', async () => {
      const result = await app.get(`/v1/patient/${patient.id}/administeredVaccines`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(1);
      expect(result.body.data[0].status).toEqual(VACCINE_STATUS.GIVEN);
    });

    it('Should include not given vaccines', async () => {
      const freshPatient = await models.Patient.create(await createDummyPatient(models));
      await administerVaccine(freshPatient, scheduled1);
      await administerVaccine(freshPatient, scheduled2, { status: VACCINE_STATUS.NOT_GIVEN });
      
      const result = await app.get(`/v1/patient/${freshPatient.id}/administeredVaccines?includeNotGiven=true`);

      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data[0].status).toEqual(VACCINE_STATUS.GIVEN);
      expect(result.body.data[1].status).toEqual(VACCINE_STATUS.NOT_GIVEN);
    });

    it('Should mark an administered vaccine as recorded in error', async () => {
      const result = await app.get(`/v1/patient/${patient.id}/administeredVaccines`);

      const markedAsRecordedInError = await app
        .put(`/v1/patient/${patient.id}/administeredVaccine/${result.body.data[0].id}`)
        .send({ status: 'RECORDED_IN_ERROR' });
      expect(markedAsRecordedInError).toHaveSucceeded();
      expect(markedAsRecordedInError.body.status).toEqual('RECORDED_IN_ERROR');
    });
  });
});
