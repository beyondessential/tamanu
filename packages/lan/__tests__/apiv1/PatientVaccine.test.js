import config from 'config';

import { createDummyEncounter, createDummyPatient, randomVitals } from 'shared/demoData/patients';
import { VACCINE_CATEGORIES, VACCINE_RECORDING_TYPES, VACCINE_STATUS } from 'shared/constants';
import { fake } from 'shared/test-helpers/fake';
import { createAdministeredVaccine, createScheduledVaccine } from 'shared/demoData/vaccines';
import { createTestContext } from '../utilities';

describe('PatientVaccine', () => {
  let patient = null;
  let patient2 = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let scheduled1 = null;
  let scheduled2 = null;
  let scheduled3 = null;
  let clinician = null;
  let location = null;
  let department = null;
  let facility = null;
  let givenVaccine1 = null;
  let notGivenVaccine1 = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    clinician = await models.User.create(fake(models.User));
    [facility] = await models.Facility.upsert({
      id: config.serverFacilityId,
      name: config.serverFacilityId,
      code: config.serverFacilityId,
    });
    patient = await models.Patient.create(await createDummyPatient(models));
    patient2 = await models.Patient.create(await createDummyPatient(models));
    await models.ScheduledVaccine.truncate({ cascade: true });
    await models.AdministeredVaccine.truncate({ cascade: true });

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
    const locationGroup = await models.LocationGroup.create({
      ...fake(models.LocationGroup),
      facilityId: facility.id,
    });
    location = await models.Location.create({
      ...fake(models.Location),
      locationGroupId: locationGroup.id,
      facilityId: facility.id,
    });
    department = await models.Department.create({
      ...fake(models.Department),
      facilityId: facility.id,
    });

    // add an administered vaccine for patient1, of schedule 2
    const encounter = await models.Encounter.create(
      await createDummyEncounter(models, { patientId: patient.id }),
    );

    // create the encounter with multiple vitals records
    await models.Vitals.create({ encounterId: encounter.id, ...randomVitals() });
    await models.Vitals.create({ encounterId: encounter.id, ...randomVitals() });

    givenVaccine1 = await models.AdministeredVaccine.create(
      await createAdministeredVaccine(models, {
        scheduledVaccineId: scheduled2.id,
        encounterId: encounter.id,
        status: VACCINE_STATUS.GIVEN,
      }),
    );

    notGivenVaccine1 = await models.AdministeredVaccine.create(
      await createAdministeredVaccine(models, {
        scheduledVaccineId: scheduled2.id,
        encounterId: encounter.id,
        status: VACCINE_STATUS.NOT_GIVEN,
      }),
    );

    await models.AdministeredVaccine.create(
      await createAdministeredVaccine(models, {
        scheduledVaccineId: scheduled2.id,
        encounterId: encounter.id,
        status: VACCINE_STATUS.UNKNOWN,
      }),
    );
  });
  afterAll(() => ctx.close());

  it('should reject with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.get('/v1/patient/1/scheduledVaccines', {});
    expect(result).toBeForbidden();
  });

  describe('Scheduled vaccines', () => {
    it('should get a list of scheduled vaccines', async () => {
      const result = await app.get(`/v1/patient/1/scheduledVaccines`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(2);
    });

    it('should get a list of scheduled vaccines based on category', async () => {
      const result = await app.get(
        `/v1/patient/1/scheduledVaccines?category=${VACCINE_CATEGORIES.CAMPAIGN}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0]).toHaveProperty('id', scheduled3.id);
    });

    it('should indicate administered vaccine', async () => {
      const patient1Result = await app.get(
        `/v1/patient/${patient.id}/scheduledVaccines?category=${VACCINE_CATEGORIES.ROUTINE}`,
      );
      expect(patient1Result).toHaveSucceeded();
      expect(patient1Result.body).toHaveLength(1);
      expect(patient1Result.body[0].schedules).toEqual([
        { administered: false, schedule: 'Dose 1', scheduledVaccineId: scheduled1.id },
        { administered: true, schedule: 'Dose 2', scheduledVaccineId: scheduled2.id },
      ]);

      const patient2Result = await app.get(
        `/v1/patient/${patient2.id}/scheduledVaccines?category=${VACCINE_CATEGORIES.ROUTINE}`,
      );
      expect(patient2Result).toHaveSucceeded();
      expect(patient2Result.body).toHaveLength(1);
      expect(patient2Result.body[0].schedules).toEqual([
        { administered: false, schedule: 'Dose 1', scheduledVaccineId: scheduled1.id },
        { administered: false, schedule: 'Dose 2', scheduledVaccineId: scheduled2.id },
      ]);
    });
  });

  describe('Administered vaccines', () => {
    it('Should get administered vaccines', async () => {
      const result = await app.get(`/v1/patient/${patient.id}/administeredVaccines`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data.find(v => v.status === VACCINE_STATUS.GIVEN)?.id).toEqual(
        givenVaccine1.id,
      );
      expect(result.body.data.find(v => v.status === VACCINE_STATUS.NOT_GIVEN)?.id).toEqual(
        notGivenVaccine1.id,
      );
    });

    it('Should mark an administered vaccine as recorded in error', async () => {
      const result = await app.get(`/v1/patient/${patient.id}/administeredVaccines`);

      const markedAsRecordedInError = await app
        .put(`/v1/patient/${patient.id}/administeredVaccine/${result.body.data[0].id}`)
        .send({ status: 'RECORDED_IN_ERROR' });
      expect(markedAsRecordedInError).toHaveSucceeded();
      expect(markedAsRecordedInError.body.status).toEqual('RECORDED_IN_ERROR');
    });

    it('Should record vaccine with country when it is given overseas', async () => {
      const [country] = await models.ReferenceData.upsert({
        type: 'country',
        name: 'Australia',
        code: 'Australia',
      });

      const result = await app.post(`/v1/patient/${patient.id}/administeredVaccine`).send({
        status: VACCINE_RECORDING_TYPES.GIVEN,
        locationId: location.id,
        departmentId: department.id,
        scheduledVaccineId: scheduled1.id,
        recorderId: clinician.id,
        patientId: patient.id,
        date: new Date(),
        givenElsewhere: true,
        givenBy: country.name,
      });

      expect(result).toHaveSucceeded();

      const vaccine = await models.AdministeredVaccine.findByPk(result.body.id);

      expect(vaccine.givenElsewhere).toEqual(true);
      expect(vaccine.givenBy).toEqual(country.name);
    });

    it('Should record vaccine with correct values when category is Other', async () => {
      const VACCINE_BRAND = 'Test Vaccine Brand';
      const VACCINE_NAME = 'Test Vaccine Name';
      const VACCINE_DISEASE = 'Test Vaccine Disease';

      const otherScheduledVaccine = await models.ScheduledVaccine.create(
        await createScheduledVaccine(models, { category: VACCINE_CATEGORIES.OTHER }),
      );

      const result = await app.post(`/v1/patient/${patient.id}/administeredVaccine`).send({
        status: VACCINE_RECORDING_TYPES.GIVEN,
        category: VACCINE_CATEGORIES.OTHER,
        locationId: location.id,
        departmentId: department.id,
        recorderId: clinician.id,
        patientId: patient.id,
        date: new Date(),
        vaccineBrand: VACCINE_BRAND,
        vaccineName: VACCINE_NAME,
        disease: VACCINE_DISEASE,
      });

      expect(result).toHaveSucceeded();

      const vaccine = await models.AdministeredVaccine.findByPk(result.body.id);

      expect(vaccine.scheduledVaccineId).toEqual(otherScheduledVaccine.id);
      expect(vaccine.vaccineBrand).toEqual(VACCINE_BRAND);
      expect(vaccine.vaccineName).toEqual(VACCINE_NAME);
      expect(vaccine.disease).toEqual(VACCINE_DISEASE);
    });
  });
});
