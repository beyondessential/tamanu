import { ADMINISTRATION_FREQUENCY_DETAILS } from '@tamanu/constants';
import { Database } from '~/infra/db';
import { ADMINISTRATION_FREQUENCIES } from '~/constants/medications';
import { SYSTEM_USER_UUID } from '~/constants';
import { TASK_TYPES } from '~/constants/tasks';
import { EncounterType } from '~/types/IEncounter';
import { getCurrentDateTimeString } from '~/ui/helpers/date';
import { fakeEncounter, fakePatient, fakeUser } from '/root/tests/helpers/fake';

// Local ISO 9075 datetime, e.g. "2026-07-10 20:00:00" (space separator, no timezone suffix).
const ISO_9075_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

describe('MedicationAdministrationRecord', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.MedicationAdministrationRecord.clear();
    await Database.models.EncounterPrescription.clear();
    await Database.models.Prescription.clear();
    await Database.models.Task.clear();
  });

  const createAdmission = async () => {
    const patient = fakePatient();
    await Database.models.Patient.insert(patient);
    const user = fakeUser();
    await Database.models.User.insert(user);
    await Database.models.User.save({ ...fakeUser(), id: SYSTEM_USER_UUID });

    const encounter = fakeEncounter();
    encounter.encounterType = EncounterType.Admission;
    encounter.patient = patient;
    encounter.examiner = user;
    await Database.models.Encounter.insert(encounter);

    return encounter;
  };

  const createAdmittedPrescription = async frequency => {
    const encounter = await createAdmission();
    const prescription = await Database.models.Prescription.createAndSaveOne({
      date: getCurrentDateTimeString(),
      startDate: getCurrentDateTimeString(),
      frequency,
      idealTimes: ADMINISTRATION_FREQUENCY_DETAILS[frequency].startTimes.join(','),
      dosingUnit: 'mg',
    });
    await Database.models.EncounterPrescription.createAndSaveOne({
      encounter: encounter.id,
      prescription: prescription.id,
    });
    return prescription;
  };

  describe('generateMedicationAdministrationRecords', () => {
    it('stores auto-generated dueAt as a local ISO 9075 datetime string', async () => {
      const prescription = await Database.models.Prescription.createAndSaveOne({
        date: getCurrentDateTimeString(),
        startDate: getCurrentDateTimeString(),
        frequency: ADMINISTRATION_FREQUENCIES.DAILY,
        idealTimes: '08:00,20:00',
        dosingUnit: 'mg',
      });

      await Database.models.MedicationAdministrationRecord.generateMedicationAdministrationRecords(
        prescription,
      );

      const records = await Database.models.MedicationAdministrationRecord.find({
        where: { prescriptionId: prescription.id },
      });

      expect(records.length).toBeGreaterThan(0);
      for (const record of records) {
        expect(record.dueAt).toMatch(ISO_9075_DATETIME);
      }
    });

    it('generates records for hourly, whose administration times are fixed', async () => {
      const prescription = await Database.models.Prescription.createAndSaveOne({
        date: getCurrentDateTimeString(),
        startDate: getCurrentDateTimeString(),
        frequency: ADMINISTRATION_FREQUENCIES.HOURLY,
        idealTimes: ADMINISTRATION_FREQUENCY_DETAILS[ADMINISTRATION_FREQUENCIES.HOURLY].startTimes.join(
          ',',
        ),
        dosingUnit: 'mg',
      });

      await Database.models.MedicationAdministrationRecord.generateMedicationAdministrationRecords(
        prescription,
      );

      const records = await Database.models.MedicationAdministrationRecord.find({
        where: { prescriptionId: prescription.id },
      });

      expect(records.length).toBeGreaterThan(0);
      for (const record of records) {
        expect(record.dueAt).toMatch(ISO_9075_DATETIME);
      }
    });

    it.each([ADMINISTRATION_FREQUENCIES.HOURLY, ADMINISTRATION_FREQUENCIES.HALF_HOURLY])(
      'generates no due tasks for %s',
      async frequency => {
        const prescription = await createAdmittedPrescription(frequency);

        await Database.models.MedicationAdministrationRecord.generateMedicationAdministrationRecords(
          prescription,
        );

        const records = await Database.models.MedicationAdministrationRecord.find({
          where: { prescriptionId: prescription.id },
        });
        expect(records.length).toBeGreaterThan(0);

        const tasks = await Database.models.Task.find({
          where: { taskType: TASK_TYPES.MEDICATION_DUE_TASK },
        });
        expect(tasks).toHaveLength(0);
      },
    );

    it('generates a due task for daily', async () => {
      const prescription = await createAdmittedPrescription(ADMINISTRATION_FREQUENCIES.DAILY);

      await Database.models.MedicationAdministrationRecord.generateMedicationAdministrationRecords(
        prescription,
      );

      const tasks = await Database.models.Task.find({
        where: { taskType: TASK_TYPES.MEDICATION_DUE_TASK },
      });
      expect(tasks.length).toBeGreaterThan(0);
    });

    // Central allows an empty idealTimes array, which arrives here as ''. That must degrade to
    // "no records" rather than throwing part-way through.
    it('generates no records, without throwing, when there are no administration times', async () => {
      const prescription = await Database.models.Prescription.createAndSaveOne({
        date: getCurrentDateTimeString(),
        startDate: getCurrentDateTimeString(),
        frequency: ADMINISTRATION_FREQUENCIES.DAILY,
        idealTimes: '',
        dosingUnit: 'mg',
      });

      await Database.models.MedicationAdministrationRecord.generateMedicationAdministrationRecords(
        prescription,
      );

      const records = await Database.models.MedicationAdministrationRecord.find({
        where: { prescriptionId: prescription.id },
      });

      expect(records).toHaveLength(0);
    });
  });
});
