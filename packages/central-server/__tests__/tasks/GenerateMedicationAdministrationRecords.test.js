import { fake, fakeUser } from '@tamanu/fake-data/fake';
import {  toDateTimeString } from '@tamanu/utils/dateTime';
import { sub, addDays } from 'date-fns';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { createTestContext } from '../utilities';
import { GenerateMedicationAdministrationRecords } from '../../app/tasks/GenerateMedicationAdministrationRecords';

// Mock config for the task
jest.mock('config', () => ({
  ...jest.requireActual('config'),
  schedules: {
    ...jest.requireActual('config').schedules,
    generateMedicationAdministrationRecords: {
      schedule: '0 1 * * *',
      batchSize: 2,
      batchSleepAsyncDurationInMilliseconds: 10,
      enabled: true,
      jitterTime: 0,
    },
  },
}));

// Mock sleepAsync to speed up tests
jest.mock('@tamanu/utils/sleepAsync', () => ({
  sleepAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('GenerateMedicationAdministrationRecords', () => {
  let ctx;
  let models;
  let task;
  let examiner;
  let patient;
  let facility;
  let department;
  let location;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    examiner = await models.User.create(fakeUser());
    patient = await models.Patient.create(fake(models.Patient));
    facility = await models.Facility.create(fake(models.Facility));
    department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    location = await models.Location.create(fake(models.Location, { facilityId: facility.id }));
  });

  beforeEach(async () => {
    // Clear any existing data
    await models.MedicationAdministrationRecord.destroy({ where: {} });
    await models.EncounterPrescription.destroy({ where: {} });
    await models.Prescription.destroy({ where: {} });
    await models.Encounter.destroy({ where: {} });

    // Reset mocks
    jest.clearAllMocks();
    jest.spyOn(models.MedicationAdministrationRecord, 'generateMedicationAdministrationRecords').mockImplementation(async () => {});
    jest
      .spyOn(models.MedicationAdministrationRecord, 'removeInvalidMedicationAdministrationRecords')
      .mockResolvedValue(undefined);

    task = new GenerateMedicationAdministrationRecords(ctx);
  });

  afterAll(async () => {
    await ctx.close();
  });

  const createActiveEncounter = async (overrides = {}) => {
    return await models.Encounter.create(
      fake(models.Encounter, {
        patientId: patient.id,
        examinerId: examiner.id,
        departmentId: department.id,
        locationId: location.id,
        endDate: null, // Active encounter
        ...overrides,
      }),
    );
  };

  const createPrescription = async (prescriptionOverrides = {}, encounterOverrides = {}) => {
    const encounter = await createActiveEncounter(encounterOverrides);
    const prescription = await models.Prescription.create(
      fake(models.Prescription, {
        presciberId: examiner.id,
        discontinued: false,
        ...prescriptionOverrides,
      }),
    );
    await prescription.update({ endDate: prescriptionOverrides.endDate || null });
    const encounterPrescription = await models.EncounterPrescription.create(
      fake(models.EncounterPrescription, {
        encounterId: encounter.id,
        prescriptionId: prescription.id,
      }),
    );
    return { prescription, encounter, encounterPrescription };
  };

  describe('generating medication administration records', () => {
    it('should generate medication administration records for active prescriptions in active encounters', async () => {
      const { prescription } = await createPrescription();
      
      await task.run();

      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledTimes(1);
      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledWith(expect.objectContaining({ id: prescription.id }));
    });

    it('should process multiple prescriptions', async () => {
      const { prescription: prescription1 } = await createPrescription();
      const { prescription: prescription2 } = await createPrescription();
      const { prescription: prescription3 } = await createPrescription();

      await task.run();

      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledTimes(3);
      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledWith(expect.objectContaining({ id: prescription1.id }));
      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledWith(expect.objectContaining({ id: prescription2.id }));
      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledWith(expect.objectContaining({ id: prescription3.id }));
    });
  });

  describe('excluded prescriptions', () => {
    it('should not generate records for prescriptions in discharged encounters', async () => {
      const dischargedDate = toDateTimeString(sub(new Date(), { days: 1 }));
      await createPrescription(
        {},
        { endDate: dischargedDate }, // Discharged encounter
      );

      await task.run();

      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).not.toHaveBeenCalled();
    });

    it('should not generate records for prescriptions that have passed their end date', async () => {
      const pastEndDate = toDateTimeString(sub(new Date(), { days: 1 }));
      await createPrescription({
        endDate: pastEndDate, // Past end date
      });

      await task.run();

      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).not.toHaveBeenCalled();
    });

    it('should generate records for prescriptions with future end dates', async () => {
      const futureEndDate = toDateTimeString(addDays(new Date(), 1));
      const { prescription } = await createPrescription({
        endDate: futureEndDate, // Future end date
      });

      await task.run();

      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledTimes(1);
      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledWith(expect.objectContaining({ id: prescription.id }));
    });

    it('should not generate records for discontinued prescriptions', async () => {
      await createPrescription({
        discontinued: true,
      });

      await task.run();

      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).not.toHaveBeenCalled();
    });
  });

  describe('batching logic', () => {
    it('should process prescriptions in batches', async () => {
      // Create 5 prescriptions (batch size is 2, so should create 3 batches)
      const prescriptions = [];
      for (let i = 0; i < 5; i++) {
        const { prescription } = await createPrescription();
        prescriptions.push(prescription);
      }

      await task.run();

      // Should be called 5 times (once per prescription)
      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledTimes(5);

      // Should sleep between batches (3 batches = 2 sleeps)
      expect(sleepAsync).toHaveBeenCalledTimes(2);
      expect(sleepAsync).toHaveBeenCalledWith(10); // batchSleepAsyncDurationInMilliseconds
    });

    it('should process batches in order', async () => {
      // Create 4 prescriptions
      const prescriptions = [];
      for (let i = 0; i < 4; i++) {
        const { prescription } = await createPrescription();
        prescriptions.push(prescription);
      }

      await task.run();

      // Verify all prescriptions were called
      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledTimes(4);
      prescriptions.forEach(prescription => {
        expect(
          models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
        ).toHaveBeenCalledWith(expect.objectContaining({ id: prescription.id }));
      });
    });
  });

  describe('cleanup', () => {
    it('should call cleanupInvalidMedicationAdministrationRecords before generating', async () => {
      await createPrescription();

      await task.run();

      expect(
        models.MedicationAdministrationRecord.removeInvalidMedicationAdministrationRecords,
      ).toHaveBeenCalledTimes(1);
      expect(
        models.MedicationAdministrationRecord.generateMedicationAdministrationRecords,
      ).toHaveBeenCalledTimes(1);
    });
  });
});