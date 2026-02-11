import config from 'config';
import { v4 as uuidv4 } from 'uuid';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

describe('Medication', () => {
  const [facilityId] = selectFacilityIds(config);
  let app = null;
  let baseApp = null;
  let models = null;
  let patient = null;
  let location = null;
  let department = null;
  let ctx = null;

  const createOngoingPrescription = async ({
    patientId,
    prescriberId,
    name,
    code,
    repeats = 3,
  }) => {
    const medication = await models.ReferenceData.create({ type: 'drug', name, code });
    const prescription = await models.Prescription.create({
      medicationId: medication.id,
      prescriberId,
      doseAmount: 1,
      units: 'mg',
      frequency: 'Immediately',
      route: 'oral',
      date: '2025-01-01',
      startDate: getCurrentDateTimeString(),
      isOngoing: true,
      repeats,
    });
    await models.PatientOngoingPrescription.create({
      patientId,
      prescriptionId: prescription.id,
    });
    return prescription;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(fake(models.Patient));

    // Create location and department for the facility (required for send-ongoing-to-pharmacy)
    const locationGroup = await models.LocationGroup.create(
      fake(models.LocationGroup, { facilityId }),
    );
    location = await models.Location.create(
      fake(models.Location, { locationGroupId: locationGroup.id, facilityId }),
    );
    department = await models.Department.create(fake(models.Department, { facilityId }));

    await models.Setting.set(
      'medications.medicationDispensing.automaticEncounterLocationId',
      location.id,
      SETTINGS_SCOPES.FACILITY,
      facilityId,
    );
    await models.Setting.set(
      'medications.medicationDispensing.automaticEncounterDepartmentId',
      department.id,
      SETTINGS_SCOPES.FACILITY,
      facilityId,
    );
  });

  afterAll(() => ctx.close());

  describe('POST /api/medication/send-ongoing-to-pharmacy', () => {
    describe('repeats', () => {
      it('should not decrement on the first send to pharmacy', async () => {
        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: app.user.id,
          name: 'TestMedication',
          code: 'test-med',
        });

        const result = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [
            {
              prescriptionId: ongoingPrescription.id,
              quantity: 10,
            },
          ],
        });

        expect(result).toHaveSucceeded();

        const reloadedPrescription = await models.Prescription.findByPk(ongoingPrescription.id);
        expect(reloadedPrescription.repeats).toBe(3);
      });

      it('should decrement on the second send to pharmacy', async () => {
        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: app.user.id,
          name: 'TestMedication2',
          code: 'test-med-2',
        });

        // First send - should not decrement
        const firstResult = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [
            {
              prescriptionId: ongoingPrescription.id,
              quantity: 10,
            },
          ],
        });

        expect(firstResult).toHaveSucceeded();

        const afterFirst = await models.Prescription.findByPk(ongoingPrescription.id);
        expect(afterFirst.repeats).toBe(3);

        // Second send - should decrement
        const secondResult = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [
            {
              prescriptionId: ongoingPrescription.id,
              quantity: 10,
            },
          ],
        });

        expect(secondResult).toHaveSucceeded();

        const afterSecond = await models.Prescription.findByPk(ongoingPrescription.id);
        expect(afterSecond.repeats).toBe(2);
      });

      it('should throw an error if the prescription has no repeats remaining', async () => {
        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: app.user.id,
          name: 'TestMedicationNoRepeats',
          code: 'test-med-no-repeats',
        });

        // First send - establishes lastOrderedAt
        const firstResult = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [
            {
              prescriptionId: ongoingPrescription.id,
              quantity: 10,
            },
          ],
        });

        expect(firstResult).toHaveSucceeded();

        // Decrement to 0 (simulating multiple sends)
        await ongoingPrescription.update({ repeats: 0 });

        // Second send - should fail with no repeats remaining
        const secondResult = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [
            {
              prescriptionId: ongoingPrescription.id,
              quantity: 10,
            },
          ],
        });

        expect(secondResult).toHaveRequestError();
        expect(secondResult.body.error.message).toContain('no remaining repeats');
      });
      it('should throw error if the prescription is linked to an active encounter', async () => {
        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: app.user.id,
          name: 'TestMedicationActiveEncounter',
          code: 'test-med-active-enc',
        });

        // Create an active encounter for the patient (endDate: null)
        await models.Encounter.create({
          patientId: patient.id,
          encounterType: 'clinic',
          startDate: getCurrentDateTimeString(),
          endDate: null,
          reasonForEncounter: 'Clinic visit',
          examinerId: app.user.id,
          locationId: location.id,
          departmentId: department.id,
        });

        const result = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [
            {
              prescriptionId: ongoingPrescription.id,
              quantity: 10,
            },
          ],
        });

        expect(result).toHaveRequestError();
        expect(result.body.error.message).toContain('active encounter');

        // Prescription repeats should be unchanged since we never got to the decrement logic
        const reloadedPrescription = await models.Prescription.findByPk(ongoingPrescription.id);
        expect(reloadedPrescription.repeats).toBe(3);
      });
    });
  });

  describe('POST /api/medication/dispense', () => {
    const createPharmacyOrderWithPrescription = async ({ patientId, repeats = 1 }) => {
      const medication = await models.ReferenceData.create({
        type: 'drug',
        name: `DispenseMed-${Date.now()}`,
        code: `disp-med-${Date.now()}`,
      });
      const encounter = await models.Encounter.create({
        patientId,
        encounterType: 'clinic',
        startDate: getCurrentDateTimeString(),
        endDate: getCurrentDateTimeString(),
        reasonForEncounter: 'Dispense test',
        examinerId: app.user.id,
        locationId: location.id,
        departmentId: department.id,
      });
      const prescription = await models.Prescription.create({
        medicationId: medication.id,
        prescriberId: app.user.id,
        doseAmount: 1,
        units: 'mg',
        frequency: 'Immediately',
        route: 'oral',
        date: '2025-01-01',
        startDate: getCurrentDateTimeString(),
      });
      await models.EncounterPrescription.create({
        encounterId: encounter.id,
        prescriptionId: prescription.id,
      });
      const pharmacyOrder = await models.PharmacyOrder.create({
        orderingClinicianId: app.user.id,
        encounterId: encounter.id,
        isDischargePrescription: true,
        date: getCurrentDateTimeString(),
        facilityId,
      });
      const pharmacyOrderPrescription = await models.PharmacyOrderPrescription.create({
        id: uuidv4(),
        pharmacyOrderId: pharmacyOrder.id,
        prescriptionId: prescription.id,
        quantity: 10,
        repeats,
      });
      return { pharmacyOrderPrescription, encounter, prescription };
    };

    it('should dispense medication successfully', async () => {
      const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
        patientId: patient.id,
      });

      const result = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
            quantity: 10,
            instructions: 'Take with food',
          },
        ],
      });

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0].pharmacyOrderPrescriptionId).toBe(pharmacyOrderPrescription.id);
    });

    it('should only be able to be dispensed once', async () => {
      const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
        patientId: patient.id,
        repeats: 0,
      });

      const firstResult = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
            quantity: 10,
            instructions: 'Initial dispense',
          },
        ],
      });
      expect(firstResult).toHaveSucceeded();

      const secondResult = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
            quantity: 10,
            instructions: 'Second dispense',
          },
        ],
      });
      expect(secondResult).toHaveRequestError();
    });

    it('should reject dispense when prescriptions are from different patients', async () => {
      const otherPatient = await models.Patient.create(fake(models.Patient));
      const { pharmacyOrderPrescription: pop1 } = await createPharmacyOrderWithPrescription({
        patientId: patient.id,
      });
      const { pharmacyOrderPrescription: pop2 } = await createPharmacyOrderWithPrescription({
        patientId: otherPatient.id,
      });

      const result = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pop1.id,
            quantity: 10,
            instructions: 'Dispense 1',
          },
          {
            pharmacyOrderPrescriptionId: pop2.id,
            quantity: 10,
            instructions: 'Dispense 2',
          },
        ],
      });

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toContain('same patient');
    });
  });

  describe('POST /api/encounter/:id/pharmacyOrder', () => {
    describe('repeats', () => {
      it('should not decrement prescription repeats when sending from encounter', async () => {
        const medication = await models.ReferenceData.create({
          type: 'drug',
          name: 'TestMedicationEncounter',
          code: 'test-med-enc',
        });

        const encounter = await models.Encounter.create({
          patientId: patient.id,
          encounterType: 'clinic',
          startDate: getCurrentDateTimeString(),
          endDate: null,
          reasonForEncounter: 'Clinic visit',
          examinerId: app.user.id,
          locationId: location.id,
          departmentId: department.id,
        });

        const prescription = await models.Prescription.create({
          medicationId: medication.id,
          prescriberId: app.user.id,
          doseAmount: 1,
          units: 'mg',
          frequency: 'Immediately',
          route: 'oral',
          date: '2025-01-01',
          startDate: getCurrentDateTimeString(),
          repeats: 3,
        });

        await models.EncounterPrescription.create({
          encounterId: encounter.id,
          prescriptionId: prescription.id,
        });

        const result = await app.post(`/api/encounter/${encounter.id}/pharmacyOrder`).send({
          orderingClinicianId: app.user.id,
          isDischargePrescription: true,
          facilityId,
          pharmacyOrderPrescriptions: [
            {
              prescriptionId: prescription.id,
              quantity: 10,
              repeats: 3,
            },
          ],
        });

        expect(result).toHaveSucceeded();

        const reloadedPrescription = await models.Prescription.findByPk(prescription.id);
        expect(reloadedPrescription.repeats).toBe(3);
      });
    });
  });
});
