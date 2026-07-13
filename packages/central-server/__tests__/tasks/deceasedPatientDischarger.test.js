import { sub } from 'date-fns';
import { ENCOUNTER_TYPES } from '@tamanu/constants/encounters';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { toDateTimeString } from '@tamanu/utils/dateTime';

import { DeceasedPatientDischarger } from '../../app/tasks/DeceasedPatientDischarger';
import { createTestContext } from '../utilities';

describe('Deceased patient discharger', () => {
  let ctx;
  let models;
  let examiner;
  let department;
  let location;

  const runDischarger = (configOverrides = {}) => {
    const discharger = new DeceasedPatientDischarger(ctx);
    discharger.config = {
      ...discharger.config,
      batchSleepAsyncDurationInMilliseconds: 1,
      ...configOverrides,
    };
    return discharger.run();
  };

  const createDeceasedPatient = async ({ withDeathData = true, clinicianId = null } = {}) => {
    const patient = await models.Patient.create(
      fake(models.Patient, {
        dateOfDeath: toDateTimeString(sub(new Date(), { days: 1 })),
      }),
    );
    if (withDeathData) {
      await models.PatientDeathData.create(
        fake(models.PatientDeathData, {
          patientId: patient.id,
          clinicianId: clinicianId ?? examiner.id,
        }),
      );
    }
    return patient;
  };

  const createOpenEncounter = (patient, id) =>
    models.Encounter.create({
      id,
      patientId: patient.id,
      departmentId: department.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      locationId: location.id,
      examinerId: examiner.id,
      startDate: toDateTimeString(sub(new Date(), { days: 2 })),
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    examiner = await models.User.create(fakeUser());
    const facility = await models.Facility.create(fake(models.Facility));
    department = await models.Department.create({
      ...fake(models.Department),
      facilityId: facility.id,
    });
    location = await models.Location.create({
      ...fake(models.Location),
      facilityId: facility.id,
    });
  });

  afterAll(() => ctx.close());

  it('Should discharge patients with death data even when a batch fills with skipped patients', async () => {
    // two patients whose encounters sort first but have no death data, so they
    // fill the whole first batch with rows that only ever get skipped
    const skippedPatientOne = await createDeceasedPatient({ withDeathData: false });
    const skippedPatientTwo = await createDeceasedPatient({ withDeathData: false });
    const patientOne = await createDeceasedPatient({ clinicianId: examiner.id });
    const patientTwo = await createDeceasedPatient({ clinicianId: examiner.id });

    const skippedEncounterOne = await createOpenEncounter(
      skippedPatientOne,
      'deceased-discharger-batching-1',
    );
    const skippedEncounterTwo = await createOpenEncounter(
      skippedPatientTwo,
      'deceased-discharger-batching-2',
    );
    const encounterOne = await createOpenEncounter(patientOne, 'deceased-discharger-batching-3');
    const encounterTwo = await createOpenEncounter(patientTwo, 'deceased-discharger-batching-4');

    await runDischarger({ batchSize: 2 });

    await skippedEncounterOne.reload();
    await skippedEncounterTwo.reload();
    await encounterOne.reload();
    await encounterTwo.reload();
    expect(skippedEncounterOne).toHaveProperty('endDate', null);
    expect(skippedEncounterTwo).toHaveProperty('endDate', null);
    expect(encounterOne).toHaveProperty('endDate', patientOne.dateOfDeath);
    expect(encounterTwo).toHaveProperty('endDate', patientTwo.dateOfDeath);
  });

  it('Should skip encounters whose death data clinician cannot be found', async () => {
    const deletedClinician = await models.User.create(fakeUser());
    const patientWithoutClinician = await createDeceasedPatient({
      clinicianId: deletedClinician.id,
    });
    await deletedClinician.destroy();
    const patientWithClinician = await createDeceasedPatient({ clinicianId: examiner.id });

    const encounterWithoutClinician = await createOpenEncounter(
      patientWithoutClinician,
      'deceased-discharger-clinician-1',
    );
    const encounterWithClinician = await createOpenEncounter(
      patientWithClinician,
      'deceased-discharger-clinician-2',
    );

    await runDischarger({ batchSize: 100 });

    await encounterWithoutClinician.reload();
    await encounterWithClinician.reload();
    expect(encounterWithoutClinician).toHaveProperty('endDate', null);
    expect(encounterWithClinician).toHaveProperty('endDate', patientWithClinician.dateOfDeath);
  });
});
