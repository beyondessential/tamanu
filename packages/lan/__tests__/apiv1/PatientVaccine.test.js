import config from 'config';

import { createDummyEncounter, createDummyPatient, randomVitals } from 'shared/demoData/patients';
import { VACCINE_CATEGORIES, VACCINE_RECORDING_TYPES } from 'shared/constants';
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
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    clinician = await models.User.create(fake(models.User));
    await models.Facility.upsert({
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

    // add an administered vaccine for patient1, of schedule 2
    const encounter = await models.Encounter.create(
      await createDummyEncounter(models, { patientId: patient.id }),
    );

    // create the encounter with multiple vitals records
    await models.Vitals.create({ encounterId: encounter.id, ...randomVitals() });
    await models.Vitals.create({ encounterId: encounter.id, ...randomVitals() });

    await models.AdministeredVaccine.create(
      await createAdministeredVaccine(models, {
        scheduledVaccineId: scheduled2.id,
        encounterId: encounter.id,
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
      expect(result.body.count).toEqual(1);
      expect(result.body.data[0].status).toEqual('GIVEN');
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
      const facility = await models.Facility.create(fake(models.Facility));
      const locationGroup = await models.LocationGroup.create({
        ...fake(models.LocationGroup),
        facilityId: facility.id,
      });
      const location = await models.Location.create({
        ...fake(models.Location),
        locationGroupId: locationGroup.id,
        facilityId: facility.id,
      });
      const department = await models.Department.create({
        ...fake(models.Department),
        facilityId: facility.id,
      });

      const result = await app.post(`/v1/patient/${patient.id}/administeredVaccine`).send({
        vaccineRecordingType: VACCINE_RECORDING_TYPES.GIVEN,
        locationId: location.id,
        departmentId: department.id,
        scheduledVaccineId: scheduled1.id,
        recorderId: clinician.id,
        patientId: patient.id,
        date: new Date(),
        givenOverseas: true,
        givenByCountryId: country.id,
      });

      expect(result).toHaveSucceeded();

      const vaccine = await models.AdministeredVaccine.findByPk(result.body.id);

      expect(vaccine.givenOverseas).toEqual(true);
      expect(vaccine.givenBy).toEqual(country.name);
    });
  });
});
