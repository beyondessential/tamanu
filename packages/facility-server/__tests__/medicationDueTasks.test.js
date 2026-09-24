import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  ADMINISTRATION_FREQUENCIES,
  ADMINISTRATION_FREQUENCY_DETAILS,
  ADMINISTRATION_STATUS,
  ENCOUNTER_TYPES,
  TASK_STATUSES,
  TASK_TYPES,
} from '@tamanu/constants';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { getCurrentDateString, getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { createTestContext } from './utilities';

describe('Medication due tasks', () => {
  let ctx = null;
  let models = null;
  let patient = null;
  let examiner = null;
  let department = null;
  let location = null;

  const todayAt = time => `${getCurrentDateString()} ${time}:00`;

  const createEncounter = () =>
    models.Encounter.create(
      fake(models.Encounter, {
        patientId: patient.id,
        examinerId: examiner.id,
        departmentId: department.id,
        locationId: location.id,
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        startDate: todayAt('00:00'),
        endDate: null,
      }),
    );

  const createPrescription = async ({ encounter, frequency, endTime }) => {
    const prescription = await models.Prescription.create(
      fake(models.Prescription, {
        prescriberId: examiner.id,
        frequency,
        idealTimes: [...ADMINISTRATION_FREQUENCY_DETAILS[frequency].startTimes],
        startDate: todayAt('06:00'),
        isPrn: false,
        discontinued: false,
      }),
    );
    await prescription.update({ endDate: todayAt(endTime) });
    await models.EncounterPrescription.create(
      fake(models.EncounterPrescription, {
        encounterId: encounter.id,
        prescriptionId: prescription.id,
      }),
    );
    await models.MedicationAdministrationRecord.generateMedicationAdministrationRecords(
      prescription,
    );
    return prescription;
  };

  const getMedicationDueTasks = encounter =>
    models.Task.findAll({
      where: { encounterId: encounter.id, taskType: TASK_TYPES.MEDICATION_DUE_TASK },
    });

  const getRecords = prescription =>
    models.MedicationAdministrationRecord.findAll({
      where: { prescriptionId: prescription.id },
      order: [['dueAt', 'ASC']],
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    patient = await models.Patient.create(fake(models.Patient));
    examiner = await models.User.create(fakeUser());
    const facility = await models.Facility.create(fake(models.Facility));
    department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    location = await models.Location.create(fake(models.Location, { facilityId: facility.id }));
  });

  afterEach(async () => {
    await models.MedicationAdministrationRecord.truncate({ cascade: true, force: true });
    await models.Task.truncate({ cascade: true, force: true });
    await models.EncounterPrescription.truncate({ cascade: true, force: true });
    await models.Prescription.truncate({ cascade: true, force: true });
    await models.Encounter.truncate({ cascade: true, force: true });
  });

  afterAll(() => ctx.close());

  it.each([
    [ADMINISTRATION_FREQUENCIES.HOURLY, 2],
    [ADMINISTRATION_FREQUENCIES.HALF_HOURLY, 3],
  ])('generates records but no tasks for a %s prescription', async (frequency, recordCount) => {
    const encounter = await createEncounter();
    const prescription = await createPrescription({ encounter, frequency, endTime: '07:00' });

    expect(await getRecords(prescription)).toHaveLength(recordCount);
    expect(await getMedicationDueTasks(encounter)).toHaveLength(0);
  });

  it('generates a task for a daily prescription', async () => {
    const encounter = await createEncounter();
    await createPrescription({
      encounter,
      frequency: ADMINISTRATION_FREQUENCIES.DAILY,
      endTime: '07:00',
    });

    expect(await getMedicationDueTasks(encounter)).toHaveLength(1);
  });

  it('completes a task while an hourly record shares its time slot', async () => {
    const encounter = await createEncounter();
    const daily = await createPrescription({
      encounter,
      frequency: ADMINISTRATION_FREQUENCIES.DAILY,
      endTime: '07:00',
    });
    await createPrescription({
      encounter,
      frequency: ADMINISTRATION_FREQUENCIES.HOURLY,
      endTime: '07:00',
    });

    const [task] = await getMedicationDueTasks(encounter);
    expect(task.status).toBe(TASK_STATUSES.TODO);

    const [dailyRecord] = await getRecords(daily);
    await dailyRecord.update({
      status: ADMINISTRATION_STATUS.GIVEN,
      recordedAt: getCurrentDateTimeString(),
    });

    await task.reload();
    expect(task.status).toBe(TASK_STATUSES.COMPLETED);
  });

  it('removes a task for a discontinued prescription while an hourly record shares its time slot', async () => {
    const encounter = await createEncounter();
    const daily = await createPrescription({
      encounter,
      frequency: ADMINISTRATION_FREQUENCIES.DAILY,
      endTime: '07:00',
    });
    await createPrescription({
      encounter,
      frequency: ADMINISTRATION_FREQUENCIES.HOURLY,
      endTime: '07:00',
    });

    expect(await getMedicationDueTasks(encounter)).toHaveLength(1);

    await daily.update({ discontinued: true, discontinuedDate: todayAt('05:00') });
    await models.MedicationAdministrationRecord.removeInvalidMedicationAdministrationRecords();

    expect(await getMedicationDueTasks(encounter)).toHaveLength(0);
  });
});
