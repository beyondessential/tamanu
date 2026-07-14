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

  it('Should discharge every dischargeable encounter when skipped and dischargeable rows interleave across batches', async () => {
    // Alternate skippable (no death data) and dischargeable encounters in id
    // order, with more rows than the batch size. Discharged rows leave the
    // "open encounter" filter mid-run, so pagination that advances an offset
    // over the shrinking result set slides past dischargeable rows; batching
    // must instead make progress regardless of whether rows are processed or
    // skipped.
    const skippedEncounters = [];
    const dischargeable = [];
    for (let i = 1; i <= 3; i++) {
      const skippedPatient = await createDeceasedPatient({ withDeathData: false });
      skippedEncounters.push(
        await createOpenEncounter(skippedPatient, `deceased-discharger-interleaved-${i}-skip`),
      );
      const patient = await createDeceasedPatient({ clinicianId: examiner.id });
      dischargeable.push({
        patient,
        encounter: await createOpenEncounter(
          patient,
          `deceased-discharger-interleaved-${i}-zdischarge`,
        ),
      });
    }

    await runDischarger({ batchSize: 2 });

    for (const skippedEncounter of skippedEncounters) {
      await skippedEncounter.reload();
      expect(skippedEncounter).toHaveProperty('endDate', null);
    }
    for (const { patient, encounter } of dischargeable) {
      await encounter.reload();
      expect(encounter).toHaveProperty('endDate', patient.dateOfDeath);
    }
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
