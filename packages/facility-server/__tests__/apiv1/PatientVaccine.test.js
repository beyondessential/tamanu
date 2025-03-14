import config from 'config';
import {
  createDummyEncounter,
  createDummyPatient,
  randomVitals,
} from '@tamanu/database/demoData/patients';
import {
  ENCOUNTER_TYPES,
  REFERENCE_TYPES,
  SETTINGS_SCOPES,
  SETTING_KEYS,
  VACCINE_CATEGORIES,
  VACCINE_RECORDING_TYPES,
  VACCINE_STATUS,
} from '@tamanu/constants';
import {
  createAdministeredVaccine,
  createScheduledVaccine,
} from '@tamanu/database/demoData/vaccines';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { toDateString } from '@tamanu/utils/dateTime';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { subDays, addWeeks } from 'date-fns';

describe('PatientVaccine', () => {
  const [facilityId] = selectFacilityIds(config);
  let ctx;
  let models = null;
  let app = null;
  let baseApp = null;

  let scheduled1 = null;
  let scheduled2 = null;
  let scheduled3 = null;
  let scheduled4 = null;
  let scheduled5 = null;
  let scheduled6 = null;
  let clinician = null;
  let location = null;
  let locationGroup = null;
  let department = null;
  let facility = null;
  let patient = null;
  let drug = null;

  const recordAdministeredVaccine = async (patientObject, vaccine, overrides) => {
    const encounter = await models.Encounter.create(
      await createDummyEncounter(models, { patientId: patientObject.id }),
    );
    return models.AdministeredVaccine.create(
      await createAdministeredVaccine(models, {
        scheduledVaccineId: vaccine.id,
        encounterId: encounter.id,
        ...overrides,
      }),
    );
  };

  const createNewScheduledVaccine = async (category, label, doseLabel) => {
    return models.ScheduledVaccine.create(
      await createScheduledVaccine(models, {
        category,
        label,
        doseLabel,
        vaccineId: drug.id,
      }),
    );
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    clinician = await models.User.create(fake(models.User));
    const [facilityId] = selectFacilityIds(config);
    [facility] = await models.Facility.upsert({
      id: facilityId,
      name: facilityId,
      code: facilityId,
    });
    patient = await models.Patient.create(await createDummyPatient(models));

    await models.ScheduledVaccine.truncate({ cascade: true });
    await models.AdministeredVaccine.truncate({ cascade: true });

    drug = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
    );

    // set up reference data
    // create 3 scheduled vaccines, 2 routine and 1 campaign and 2 catch up
    scheduled1 = await createNewScheduledVaccine(
      VACCINE_CATEGORIES.ROUTINE,
      'vaccine 1 routine',
      'Dose 1',
    );
    scheduled2 = await createNewScheduledVaccine(
      VACCINE_CATEGORIES.ROUTINE,
      'vaccine 1 routine',
      'Dose 2',
    );
    scheduled3 = await createNewScheduledVaccine(
      VACCINE_CATEGORIES.CAMPAIGN,
      'vaccine 1 campaign',
      'Dose 1',
    );
    scheduled4 = await createNewScheduledVaccine(
      VACCINE_CATEGORIES.CATCHUP,
      'vaccine 1 catchup',
      'Dose 1',
    );
    scheduled5 = await createNewScheduledVaccine(
      VACCINE_CATEGORIES.CATCHUP,
      'vaccine 1 catchup',
      'Dose 2',
    );
    scheduled6 = await createNewScheduledVaccine(
      VACCINE_CATEGORIES.CATCHUP,
      'vaccine 2 catchup',
      'Dose 1',
    );

    locationGroup = await models.LocationGroup.create({
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

    // set up clinical data

    await recordAdministeredVaccine(patient, scheduled2, {
      status: VACCINE_STATUS.GIVEN,
    });

    await recordAdministeredVaccine(patient, scheduled2, {
      status: VACCINE_STATUS.NOT_GIVEN,
    });

    await recordAdministeredVaccine(patient, scheduled2, {
      status: VACCINE_STATUS.UNKNOWN,
    });

    await recordAdministeredVaccine(patient, scheduled4, {
      status: VACCINE_STATUS.GIVEN,
    });

    await recordAdministeredVaccine(patient, scheduled5, {
      status: VACCINE_STATUS.GIVEN,
    });

    await recordAdministeredVaccine(patient, scheduled6, {
      status: VACCINE_STATUS.NOT_GIVEN,
    });
  });

  afterAll(() => ctx.close());

  it('should reject with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.get(`/api/patient/${patient.id}/scheduledVaccines`, {});
    expect(result).toBeForbidden();
  });

  describe('Scheduled vaccines', () => {
    it('should only return vaccines with some that have not been administered', async () => {
      const result = await app.get(`/api/patient/${patient.id}/scheduledVaccines`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(3);
    });

    it('should get a list of scheduled vaccines based on category', async () => {
      const result = await app.get(
        `/api/patient/${patient.id}/scheduledVaccines?category=${VACCINE_CATEGORIES.CAMPAIGN}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0]).toHaveProperty('id', scheduled3.id);
    });

    it('should indicate administered vaccine', async () => {
      // add an administered vaccine for patient1, of schedule 2

      const result = await app.get(
        `/api/patient/${patient.id}/scheduledVaccines?category=${VACCINE_CATEGORIES.ROUTINE}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0].schedules).toEqual([
        { administered: false, doseLabel: 'Dose 1', scheduledVaccineId: scheduled1.id },
        { administered: true, doseLabel: 'Dose 2', scheduledVaccineId: scheduled2.id },
      ]);
    });

    it('should indicate pending vaccine', async () => {
      // just create a new patient with no vaccinations
      const freshPatient = await models.Patient.create(await createDummyPatient(models));
      const result = await app.get(
        `/api/patient/${freshPatient.id}/scheduledVaccines?category=${VACCINE_CATEGORIES.ROUTINE}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0].schedules).toEqual([
        { administered: false, doseLabel: 'Dose 1', scheduledVaccineId: scheduled1.id },
        { administered: false, doseLabel: 'Dose 2', scheduledVaccineId: scheduled2.id },
      ]);
    });

    it('should only return vaccines with some that have not been administered for a category', async () => {
      // just create a new patient with no vaccinations
      const result = await app.get(
        `/api/patient/${patient.id}/scheduledVaccines?category=${VACCINE_CATEGORIES.CATCHUP}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0].schedules).toEqual([
        { administered: false, doseLabel: 'Dose 1', scheduledVaccineId: scheduled6.id },
      ]);
    });
  });

  describe('Administered vaccines', () => {
    let location2;
    let department2;
    beforeAll(async () => {
      location2 = await models.Location.create({
        ...fake(models.Location),
        locationGroupId: locationGroup.id,
        facilityId: facility.id,
      });
      department2 = await models.Department.create({
        ...fake(models.Department),
        facilityId: facility.id,
      });
      await models.Setting.set(
        SETTING_KEYS.VACCINATION_DEFAULTS,
        { locationId: location.id, departmentId: department.id },
        SETTINGS_SCOPES.FACILITY,
        facility.id,
      );
      await models.Setting.set(
        SETTING_KEYS.VACCINATION_GIVEN_ELSEWHERE_DEFAULTS,
        { locationId: location2.id, departmentId: department2.id },
        SETTINGS_SCOPES.FACILITY,
        facility.id,
      );
    });

    it('Should get administered vaccines', async () => {
      const result = await app.get(`/api/patient/${patient.id}/administeredVaccines`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(5); // there are 5 recorded given vaccines in beforeAll
    });

    it('Should get administered vaccines with pagination', async () => {
      const expectedOrder = ['vaccine 2 catchup', 'vaccine 1 routine', 'vaccine 1 routine'];
      const result = await app.get(
        `/api/patient/${patient.id}/administeredVaccines?page=0&rowsPerPage=3&orderBy=vaccineDisplayName&order=desc`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body.data.map((x) => x.vaccineDisplayName)).toEqual(expectedOrder);
    });

    it('Should include not given vaccines', async () => {
      const freshPatient = await models.Patient.create(await createDummyPatient(models));
      await recordAdministeredVaccine(freshPatient, scheduled1);
      await recordAdministeredVaccine(freshPatient, scheduled2, {
        status: VACCINE_STATUS.NOT_GIVEN,
      });

      const result = await app.get(
        `/api/patient/${freshPatient.id}/administeredVaccines?includeNotGiven=true`,
      );

      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data[0].status).toEqual(VACCINE_STATUS.GIVEN);
      expect(result.body.data[1].status).toEqual(VACCINE_STATUS.NOT_GIVEN);
    });

    it('Should mark an administered vaccine as recorded in error', async () => {
      const result = await app.get(`/api/patient/${patient.id}/administeredVaccines`);

      const markedAsRecordedInError = await app
        .put(`/api/patient/${patient.id}/administeredVaccine/${result.body.data[0].id}`)
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

      const result = await app.post(`/api/patient/${patient.id}/administeredVaccine`).send({
        status: VACCINE_RECORDING_TYPES.GIVEN,
        scheduledVaccineId: scheduled1.id,
        recorderId: clinician.id,
        patientId: patient.id,
        date: new Date(),
        givenElsewhere: true,
        givenBy: country.name,
        facilityId,
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

      const result = await app.post(`/api/patient/${patient.id}/administeredVaccine`).send({
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
        facilityId,
      });

      expect(result).toHaveSucceeded();

      const vaccine = await models.AdministeredVaccine.findByPk(result.body.id);

      expect(vaccine.scheduledVaccineId).toEqual(otherScheduledVaccine.id);
      expect(vaccine.vaccineBrand).toEqual(VACCINE_BRAND);
      expect(vaccine.vaccineName).toEqual(VACCINE_NAME);
      expect(vaccine.disease).toEqual(VACCINE_DISEASE);
    });

    it('Should record vaccine with default department and default location when givenElsewhere is true', async () => {
      const [country] = await models.ReferenceData.upsert({
        type: 'country',
        name: 'Australia',
        code: 'Australia',
      });

      const vaccinationDefaults = await models.Setting.get(
        SETTING_KEYS.VACCINATION_GIVEN_ELSEWHERE_DEFAULTS,
        facility.id,
      );

      const result = await app.post(`/api/patient/${patient.id}/administeredVaccine`).send({
        status: VACCINE_RECORDING_TYPES.GIVEN,
        scheduledVaccineId: scheduled1.id,
        recorderId: clinician.id,
        patientId: patient.id,
        date: new Date(),
        givenElsewhere: true,
        givenBy: country.name,
        facilityId,
      });

      expect(result).toHaveSucceeded();

      const vaccine = await models.AdministeredVaccine.findByPk(result.body.id);
      const encounter = await models.Encounter.findByPk(vaccine.encounterId);

      expect(encounter.locationId).toEqual(vaccinationDefaults.locationId);
      expect(encounter.departmentId).toEqual(vaccinationDefaults.departmentId);
    });

    it('Should update corresponding NOT_GIVEN vaccine to HISTORICAL when recording GIVEN vaccine', async () => {
      const freshPatient = await models.Patient.create(await createDummyPatient(models));
      const notGivenVaccine = await recordAdministeredVaccine(freshPatient, scheduled1, {
        status: VACCINE_STATUS.NOT_GIVEN,
      });

      const result = await app.post(`/api/patient/${freshPatient.id}/administeredVaccine`).send({
        status: VACCINE_STATUS.GIVEN,
        scheduledVaccineId: scheduled1.id,
        recorderId: clinician.id,
        date: new Date(),
        givenBy: 'Clinician',
        facilityId,
      });

      expect(result).toHaveSucceeded();

      const givenVaccine = await models.AdministeredVaccine.findByPk(result.body.id);
      const histocalVaccine = await models.AdministeredVaccine.findByPk(notGivenVaccine.id);

      expect(givenVaccine.status).toEqual(VACCINE_STATUS.GIVEN);
      expect(histocalVaccine.status).toEqual(VACCINE_STATUS.HISTORICAL);
    });

    it('Should assign current date to vaccine date when no date is provided', async () => {
      const result = await app.post(`/api/patient/${patient.id}/administeredVaccine`).send({
        status: VACCINE_STATUS.GIVEN,
        scheduledVaccineId: scheduled1.id,
        recorderId: clinician.id,
        givenBy: 'Clinician',
        facilityId,
      });

      expect(result).toHaveSucceeded();

      const vaccine = await models.AdministeredVaccine.findByPk(result.body.id);
      const encounter = await models.Encounter.findByPk(vaccine.encounterId);
      expect(vaccine.date).toBeDefined();
      expect(encounter.startDate).toBeDefined();
      expect(encounter.endDate).toBeDefined();
    });

    it('Should not have current date as default', async () => {
      const result = await app.post(`/api/patient/${patient.id}/administeredVaccine`).send({
        status: VACCINE_STATUS.GIVEN,
        scheduledVaccineId: scheduled1.id,
        recorderId: clinician.id,
        givenBy: 'Clinician',
        givenElsewhere: true,
        facilityId,
      });

      expect(result).toHaveSucceeded();

      const vaccine = await models.AdministeredVaccine.findByPk(result.body.id);
      expect(vaccine.date).toBe(null);
    });

    it('Should create a vaccine encounter with the correct description', async () => {
      const result = await app.post(`/api/patient/${patient.id}/administeredVaccine`).send({
        status: VACCINE_STATUS.GIVEN,
        scheduledVaccineId: scheduled1.id,
        recorderId: clinician.id,
        givenBy: 'Clinician',
        givenElsewhere: true,
        facilityId,
      });

      expect(result).toHaveSucceeded();

      const vaccine = await models.AdministeredVaccine.findByPk(result.body.id);
      const encounter = await vaccine.getEncounter();
      expect(encounter).toHaveProperty('encounterType', ENCOUNTER_TYPES.VACCINATION);
      expect(encounter.reasonForEncounter).toMatch(
        `Vaccination recorded for ${drug.name} ${scheduled1.doseLabel}`,
      );
    });

    it('Should update reason for encounter with correct description when vaccine is recorded in error', async () => {
      const result = await app.get(`/api/patient/${patient.id}/administeredVaccines`);
      const vaccineId = result.body.data[0].id;
      const vaccine = await models.AdministeredVaccine.findByPk(vaccineId);
      const encounter = await vaccine.getEncounter();

      const markedAsRecordedInError = await app
        .put(`/api/patient/${patient.id}/administeredVaccine/${vaccineId}`)
        .send({ status: VACCINE_STATUS.RECORDED_IN_ERROR });

      expect(markedAsRecordedInError).toHaveSucceeded();

      const updatedVaccine = await models.AdministeredVaccine.findByPk(
        markedAsRecordedInError.body.id,
      );
      const updatedEncounter = await updatedVaccine.getEncounter();
      expect(updatedVaccine.status).toEqual(VACCINE_STATUS.RECORDED_IN_ERROR);
      expect(updatedEncounter.reasonForEncounter).toMatch(
        `${encounter.reasonForEncounter} reverted`,
      );
    });
  });

  describe('Administered vaccines table', () => {
    let readPatient = null;
    let vaccineOld;
    let vaccineNew;
    let vaccineNull;

    beforeAll(async () => {
      readPatient = await models.Patient.create(await createDummyPatient(models));
      vaccineNew = await recordAdministeredVaccine(readPatient, scheduled1, {
        date: '2023-01-01',
      });
      vaccineOld = await recordAdministeredVaccine(readPatient, scheduled2, {
        date: '2010-01-01',
      });
      vaccineNull = await recordAdministeredVaccine(readPatient, scheduled3, {
        date: null,
      });
    });

    it('Should return the vaccines for a patient', async () => {
      const result = await app.get(`/api/patient/${readPatient.id}/administeredVaccines`);
      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(3);
    });

    it('Should sort null dates as though they are old', async () => {
      const result = await app.get(
        `/api/patient/${readPatient.id}/administeredVaccines?orderBy=date`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(3);

      const ids = result.body.data.map((x) => x.id);
      expect(ids[0]).toEqual(vaccineNull.id);
      expect(ids[1]).toEqual(vaccineOld.id);
      expect(ids[2]).toEqual(vaccineNew.id);
    });

    it('Should sort null dates as though they are old (descending)', async () => {
      const result = await app.get(
        `/api/patient/${readPatient.id}/administeredVaccines?orderBy=date&order=desc`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(3);

      const ids = result.body.data.map((x) => x.id);
      expect(ids[0]).toEqual(vaccineNew.id);
      expect(ids[1]).toEqual(vaccineOld.id);
      expect(ids[2]).toEqual(vaccineNull.id);
    });
  });

  describe('Upcoming vaccination', () => {
    let scheduledVax1;
    let scheduledVax2;
    let scheduledVax3;
    let administeredVax2Date;
    let patient1;
    let patient2;

    beforeAll(async () => {
      await models.ScheduledVaccine.truncate({ cascade: true });
      await models.AdministeredVaccine.truncate({ cascade: true });

      scheduledVax1 = await models.ScheduledVaccine.create(
        await createScheduledVaccine(models, {
          category: VACCINE_CATEGORIES.ROUTINE,
          schedule: 'Dose 1',
          index: 1,
          weeksFromBirthDue: 1,
          vaccineId: drug.id,
        }),
      );

      scheduledVax2 = await models.ScheduledVaccine.create(
        await createScheduledVaccine(models, {
          category: VACCINE_CATEGORIES.ROUTINE,
          schedule: 'Dose 2',
          index: 2,
          weeksFromLastVaccinationDue: 2,
          vaccineId: drug.id,
        }),
      );

      scheduledVax3 = await models.ScheduledVaccine.create(
        await createScheduledVaccine(models, {
          category: VACCINE_CATEGORIES.ROUTINE,
          schedule: 'Dose 3',
          index: 3,
          weeksFromLastVaccinationDue: 4,
          vaccineId: drug.id,
        }),
      );

      patient1 = await models.Patient.create({
        ...fake(models.Patient),
        dateOfBirth: toDateString(subDays(new Date(), 1)),
      });

      patient2 = await models.Patient.create({
        ...fake(models.Patient),
        dateOfBirth: toDateString(subDays(new Date(), 365 * 2)),
      });

      await recordAdministeredVaccine(patient2, scheduledVax1, {
        status: VACCINE_STATUS.GIVEN,
        date: toDateString(subDays(new Date(), 18)),
      });

      administeredVax2Date = subDays(new Date(), 9);
      await recordAdministeredVaccine(patient2, scheduledVax2, {
        status: VACCINE_STATUS.GIVEN,
        date: toDateString(administeredVax2Date),
      });
    });

    it('should return first dose in schedule for patient 1', async () => {
      const result = await app.get(`/api/patient/${patient1.id}/upcomingVaccination`);
      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(1);
      expect(result.body.data.at(0)?.scheduledVaccineId).toEqual(scheduledVax1.id);
    });

    it('should third dose in schedule for patient 2', async () => {
      const result = await app.get(`/api/patient/${patient2.id}/upcomingVaccination`);
      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(1);

      const upcomingVax = result.body.data.at(0);
      expect(upcomingVax.scheduledVaccineId).toEqual(scheduledVax3.id);

      // Check if due date is correct according to the schedule in scheduled_vaccines
      expect(upcomingVax.dueDate).toEqual(
        toDateString(addWeeks(administeredVax2Date, scheduledVax3.weeksFromLastVaccinationDue)),
      );
    });
  });
});
